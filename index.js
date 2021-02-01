import { parse } from 'cookie';
import { encode } from 'base64url';

const METHODS = new Set(['HEAD', 'GET']);
const PURGE_CACHE_TAGS = 'Purge-Cache-Tags';

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
  ])
}

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(event) {
  const { request } = event;

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
