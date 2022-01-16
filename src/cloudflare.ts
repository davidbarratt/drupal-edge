import { X_AUTH_EMAIL, X_AUTH_KEY, CONTENT_TYPE } from "./constants";

export type cloudflareFetch = (path: string, options?: RequestInit) => Promise<Response>;

export default function createCloudflareFetch(authEmail: string, authKey: string) : cloudflareFetch {
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
