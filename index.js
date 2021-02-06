import { parse } from 'cookie';
import { encode, decode } from 'base64url';
import { BehaviorSubject, from, merge } from 'rxjs';
import { bufferCount, flatMap, map, reduce, toArray,  } from 'rxjs/operators';

const METHODS = new Set(['HEAD', 'GET']);
const PURGE_CACHE_TAGS = 'Purge-Cache-Tags';
const AUTHORIZATION = 'Authorization';
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

  if (!response.headers.has(PURGE_CACHE_TAGS)) {
    return cachePut;
  }

  const cacheKey = encode(request.url);

  const tags = response.headers.get(PURGE_CACHE_TAGS).split(' ').map((tag) => (
    CACHE_TAG.put(`${tag}|${cacheKey}`, request.url)
  ));

  return Promise.all([
    cachePut,
    ...tags,
  ]);
}

async function purgeTags(tags = []) {
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
          fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache`, {
            method: 'POST',
            headers: {
              [AUTHORIZATION]: `Bearer ${CF_API_TOKEN}`,
              [CONTENT_TYPE]: 'application/json',
            },
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

  if (request.method === 'POST' && url.pathname === '/purge') {
    if (typeof CF_API_TOKEN === 'undefined') {
      return new Response('', {
        status: 500,
      });
    }

    if (!request.headers.has(AUTHORIZATION)) {
      return new Response('', {
        status: 401,
      });
    }

    if (request.headers.get(AUTHORIZATION) !== `Bearer ${CF_API_TOKEN}`) {
      return new Response('', {
        status: 403,
      });
    }

    const data = await request.json();

    if (!data.tags) {
      return new Response('', {
        status: 400,
      });
    }

    const tags = data.tags.split('|');

    event.waitUntil(purgeTags(tags));

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

  return request.method === 'HEAD' ? headResponse(response) : response;;
}

// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
