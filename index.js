import { parse } from 'cookie';
import { encode, decode } from 'base64url';
import { BehaviorSubject, from, merge } from 'rxjs';
import { bufferCount, flatMap, map, reduce, toArray,  } from 'rxjs/operators';

const METHODS = new Set(['HEAD', 'GET']);
const CACHE_TAG = 'Cache-Tag';
const X_AUTH_EMAIL = 'X-Auth-Email';
const X_AUTH_KEY = 'X-Auth-Key';
const CF_ZONE = 'CF-Zone';
const CONTENT_TYPE = 'Content-Type';

function headResponse(original) {
  const response = new Response('', original);
  return response;
}

function modifyResponse(original) {
  // Recreate the response so we can modify the headers
  const response = new Response(original.body, original)

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');

  return response;
}

async function cacheResponse(request, response) {
  const cache = caches.default;
  const cachePut = cache.put(request, response.clone());

  if (!response.headers.has(CACHE_TAG)) {
    return cachePut;
  }

  const cacheKey = encode(request.url);

  const tags = response.headers.get(CACHE_TAG).split(',').reduce((acc, tag) => {
    const trimmedTag = tag.trim();

    // Ignore empty tags.
    if (trimmedTag === '') {
      return acc;
    }

    return [
      ...acc,
      CACHE_TAG.put([trimmedTag, cacheKey].join('|'), request.url)
    ];
  }, []);

  return Promise.all([
    cachePut,
    ...tags,
  ]);
}

function createCloudflareFetch(authEmail, authKey) {
  return (resource, options = {}) => {
    const url = new URL(resource, 'https://api.cloudflare.com/client/v4/');
    return fetch(url, {
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

async function purgeTags(fetcher, zoneId, tags = []) {
  return from(tags).pipe(
    flatMap((tag) => {
      const cursor$ = new BehaviorSubject();

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
    }, [new Set(), new Set()]),
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

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(event) {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/.cloudflare/purge') {

    if ( !request.headers.has(X_AUTH_EMAIL) || !request.headers.has(X_AUTH_KEY)) {
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

    const cloudflareFetch = createCloudflareFetch(request.headers.get(X_AUTH_EMAIL), request.headers.get(X_AUTH_KEY));
    const zoneId = request.headers.get(CF_ZONE);

    // Ensure the user has access to the specified zone.
    const zoneResponse = await cloudflareFetch(`zones/${zoneId}`);

    if (!zoneResponse.ok) {
      return zoneResponse;
    }

    event.waitUntil(purgeTags(
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
    const cookies = parse(request.headers.get('Cookie'));

    const hasSessionCookie = !!Object.keys(cookies).find((name) => name.startsWith('SSESS'));

    if (hasSessionCookie) {
      const originResponse = await fetch(request);
      return modifyResponse(originResponse);
    }
  }

  const cache = caches.default;
  const cachedResponse = await cache.match(request, {
    ignoreMethod: true,
  });

  // Cache HIT
  if (cachedResponse) {
    return request.method === 'HEAD' ? headResponse(cachedResponse) : cachedResponse;
  }

  // Cache MISS
  const originResponse = await fetch(request);
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

  event.waitUntil(cacheResponse(request, response))

  return request.method === 'HEAD' ? headResponse(response) : response;
}

// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
