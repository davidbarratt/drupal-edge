import { parse } from 'cookie';

const METHODS = new Set(['HEAD', 'GET']);

function headResponse(original) {
  const response = new Response('', origin);
  return response;
}

function modifyResponse(original) {
  // Recreate the response so we can modify the headers
  const response = new Response(original.body, original)

  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');

  return response;
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

  if (response.headers.get('CF-Cache-Status') === 'DYNAMIC' && response.status === 200) {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
  } else {
    response.headers.set('Cache-Control', 'public, max-age=2628000, s-maxage=31536000');
  }

  event.waitUntil(cache.put(request, response.clone()));

  return request.method === 'HEAD' ? headResponse(response) : response;;
}

// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});
