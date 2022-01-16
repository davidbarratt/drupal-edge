import { parse } from 'cookie';
import { decode, encode } from 'universal-base64url';
import { BehaviorSubject, from, merge } from 'rxjs';
import { bufferCount, flatMap, map, reduce, toArray,  } from 'rxjs/operators';
import trackingData from 'tracking-query-params-registry/_data/params.csv';

export { CacheTag } from './cache-tag';


const METHODS = new Set(['HEAD', 'GET']);
// The `Cache-Tag` header is swallowed by Cloudflare before it reaches the
// worker. We'll use a custom header name in the same format instead.
const X_CACHE_TAG = 'x-Cache-Tag';
const X_AUTH_EMAIL = 'X-Auth-Email';
const X_AUTH_KEY = 'X-Auth-Key';
const CF_ZONE = 'CF-Zone';
const CONTENT_TYPE = 'Content-Type';

function headResponse(original: ResponseInit) {
  const response = new Response('', original);
  return response;
}

function modifyResponse(original: Response) {
  // Recreate the response so we can modify the headers
  const response = new Response(original.body, original)

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');

  return response;
}

async function cacheResponse(url: string, response: Response) {
  const cache = caches.default;
  const cachePut = cache.put(url, response.clone());

  if (!response.headers.has(X_CACHE_TAG)) {
    return cachePut;
  }

  const cacheKey = encode(url);

  const tags =  (response.headers.get(X_CACHE_TAG) as string).split(',').reduce<Promise<void>[]>((acc, tag) => {
    const trimmedTag = tag.trim();

    // Ignore empty tags.
    if (trimmedTag === '') {
      return acc;
    }

    return [
      ...acc,
      CACHE_TAG.put([trimmedTag, cacheKey].join('|'), url)
    ];
  }, []);

  return Promise.all([
    cachePut,
    ...tags,
  ]);
}

type cloudflareFetch = (path: string, options?: RequestInit) => Promise<Response>;

function createCloudflareFetch(authEmail: string, authKey: string) : cloudflareFetch {
  return (path: string, options: RequestInit = {}) => {
    const url = new URL(path, 'https://api.cloudflare.com/client/v4/');
    return fetch(url.toString(), {
      ...options,
      headers: {
        [X_AUTH_EMAIL]: authEmail,
        [X_AUTH_KEY]: authKey,
        [CONTENT_TYPE]: 'application/json',
        ...(options.headers || {})
      },
    })
  };
}

async function purgeTags(fetcher: cloudflareFetch, zoneId: string, tags = []) {
  return from(tags).pipe(
    flatMap((tag) => {
      const cursor$ = new BehaviorSubject<string | undefined>(undefined);

      return cursor$.pipe(
        flatMap((cursor) => (
          CACHE_TAG.list({
            prefix: `${tag}|`,
            cursor,
          })
        )),
        flatMap(({ keys, list_complete: listComplete, cursor }) => {
          if (listComplete) {
            cursor$.complete();
          } else {
            cursor$.next(cursor);
          }

          return from(keys.map(({ name }) => {
            const [, encodedUrl] = name.split('|');

            return [name, decode(encodedUrl)];
          }));
        }),
      );
    }),
    reduce(([keys, urls], [key, url]) => {
      keys.add(key);
      urls.add(url);
      return [keys, urls];
    }, [new Set<string>(), new Set<string>()]),
    map(([keys, urls]) => [Array.from(keys), Array.from(urls)]),
    flatMap(([keys, urls]) => {
      const keys$ = from(keys).pipe(
        flatMap(key => CACHE_TAG.delete(key))
      );

      const urls$ = from(urls).pipe(
        // Cloudflare can purge 30 files per request.
        bufferCount(30),
        flatMap((files) => (
          fetcher(`zones/${zoneId}/purge_cache`, {
            method: 'POST',
            body: JSON.stringify({
              files,
            })
          })
        ))
      );

      return merge(keys$, urls$);
    }),
    toArray(),
  ).toPromise();
}

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);

  // Handle Purge Requests.
  if (request.method === 'POST' && url.pathname === '/.cloudflare/purge') {
    if (!request.headers.has(X_AUTH_EMAIL) || !request.headers.has(X_AUTH_KEY)) {
      return new Response('', {
        status: 401,
      });
    }

    if (!request.headers.has(CF_ZONE)) {
      return new Response('', {
        status: 400,
      });
    }

    const { tags } = await request.json();

    if (!tags) {
      return new Response('', {
        status: 400,
      });
    }

    const cloudflareFetch = createCloudflareFetch(
      request.headers.get(X_AUTH_EMAIL) || '',
      request.headers.get(X_AUTH_KEY) || ''
    );
    const zoneId = request.headers.get(CF_ZONE) || '';

    // Ensure the user has access to the specified zone.
    const zoneResponse = await cloudflareFetch(`zones/${zoneId}`);

    if (!zoneResponse.ok) {
      return zoneResponse;
    }

    ctx.waitUntil(purgeTags(
      cloudflareFetch,
      zoneId,
      tags,
    ));

    return new Response('', {
      status: 202,
    });
  }

  // Bypass for methods other than HEAD & GET
  if (!METHODS.has(request.method)) {
    const originResponse = await fetch(request);
    return modifyResponse(originResponse);
  }

  // Bypass on session cookie.
  if (request.headers.has('Cookie')) {
    const cookies = parse(request.headers.get('Cookie') || '');

    const hasSessionCookie = !!Object.keys(cookies).find((name) => name.startsWith('SSESS'));

    if (hasSessionCookie) {
      const originResponse = await fetch(request);
      return modifyResponse(originResponse);
    }
  }

  // Before looking up in cache or making a request to the origin, remove
  // all tracking params.
  trackingData.forEach(({ name }) => {
    url.searchParams.delete(name);
  });

  const cache = caches.default;
  const cachedResponse = await cache.match(url.toString());

  // Cache HIT
  if (cachedResponse) {
    return request.method === 'HEAD' ? headResponse(cachedResponse) : cachedResponse;
  }

  // Cache MISS
  const originResponse = await fetch(url.toString());
  const response = modifyResponse(originResponse);

  // Bypass on Set-Cookie
  if (response.headers.has('Set-Cookie')) {
    return response;
  }

  if (response.headers.get('CF-Cache-Status') === 'DYNAMIC') {
    // @TODO Cache any 'DYNAMIC' response that has cache tags.
    // If the response is dynamic, but is not a 200, do not cache.
    if (response.status === 200) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
    }
  } else {
    response.headers.set('Cache-Control', 'public, max-age=2628000, s-maxage=31536000');
  }

  ctx.waitUntil(cacheResponse(url.toString(), response));

  return request.method === 'HEAD' ? headResponse(response) : response;
}


export default {
  fetch: handleRequest,
}

interface Env {
  CACHE_TAG: DurableObjectNamespace
}
