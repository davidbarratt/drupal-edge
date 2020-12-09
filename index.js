import { parse } from 'cookie';

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(event) {
  const { request } = event;

  // Bypass for methods other than GET
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // Bypass on session cookie.
  if (request.headers.has('Cookie')) {
    const cookies = parse(request.headers.get('Cookie'));

    const hasSessionCookie = !!Object.keys(cookies).find((name) => name.startsWith('SSESS'));

    if (hasSessionCookie) {
      return fetch(request);
    }
  }

  const cache = caches.default;
  const cachedResponse = await cache.match(request);

  // Cache HIT
  if (cachedResponse) {
    return cachedResponse;
  }

  // Cache MISS
  const response = await fetch(request);

  // Bypass on static content.
  if (response.headers.get('CF-Cache-Status') !== 'DYNAMIC') {
    return response;
  }

  // Bypass on Set-Cookie
  if (response.headers.has('Set-Cookie')) {
    return response;
  }

  event.waitUntil(cache.put(request, response.clone()));

  return response;
}

// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
