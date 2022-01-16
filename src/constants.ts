export const METHODS = new Set(['HEAD', 'GET']);
// The `Cache-Tag` header is swallowed by Cloudflare before it reaches the
// worker. We'll use a custom header name in the same format instead.
export const X_CACHE_TAG = 'x-Cache-Tag';
export const X_AUTH_EMAIL = 'X-Auth-Email';
export const X_AUTH_KEY = 'X-Auth-Key';
export const CF_ZONE = 'CF-Zone';
export const CONTENT_TYPE = 'Content-Type';
