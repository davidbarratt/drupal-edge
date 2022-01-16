import { parse } from 'cookie';
import trackingData from 'tracking-query-params-registry/_data/params.csv';
import { METHODS, X_CACHE_TAG, X_AUTH_EMAIL, X_AUTH_KEY, CF_ZONE } from './constants';
import createCloudflareFetch from './cloudflare';

export { CacheTag } from './cache-tag';


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

async function cacheResponse(url: URL, response: Response, env: Env) {
  const cache = caches.default;
  const cachePut = cache.put(url.toString(), response.clone());
  const tagList = response.headers.get(X_CACHE_TAG) || '';

  if (!tagList) {
    return cachePut;
  }

  const id = env.CACHE_TAG.idFromName(url.hostname);
  const cacheTag = env.CACHE_TAG.get(id);

  const tagger = cacheTag.fetch(url.toString(), {
    headers: {
      [X_CACHE_TAG]: tagList,
    }
  });

  return Promise.all([
    cachePut,
    tagger,
  ]);
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

    const id = env.CACHE_TAG.idFromName(url.hostname);
    const cacheTag = env.CACHE_TAG.get(id);

    ctx.waitUntil(cacheTag.fetch(request));

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
    // If the response is dynamic, and has cache tags, it's cacheable.
    if (response.headers.get(X_CACHE_TAG)) {
      response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=31536000');
    }
  } else {
    response.headers.set('Cache-Control', 'public, max-age=2628000, s-maxage=31536000');
  }

  ctx.waitUntil(cacheResponse(url, response, env));

  return request.method === 'HEAD' ? headResponse(response) : response;
}


export default {
  fetch: handleRequest,
}

interface Env {
  CACHE_TAG: DurableObjectNamespace
}
