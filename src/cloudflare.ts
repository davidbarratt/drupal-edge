import { X_AUTH_EMAIL, X_AUTH_KEY, CONTENT_TYPE } from "./constants";

export type cloudflareFetch = typeof fetch;

export default function createCloudflareFetch(authEmail: string, authKey: string) : cloudflareFetch {
  return (resource, options) => {
    if (typeof resource === 'string') {
      resource = new URL(resource, 'https://api.cloudflare.com/client/v4/').toString();
    }
    return fetch(resource, {
      ...options,
      headers: {
        [X_AUTH_EMAIL]: authEmail,
        [X_AUTH_KEY]: authKey,
        [CONTENT_TYPE]: 'application/json',
        ...(options?.headers ?? {})
      },
    })
  };
}
