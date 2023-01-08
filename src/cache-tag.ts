import { EMPTY, from } from 'rxjs';
import { bufferCount, flatMap, toArray } from 'rxjs/operators';
import createCloudflareFetch, { cloudflareFetch } from './cloudflare';
import { CF_ZONE, X_AUTH_EMAIL, X_AUTH_KEY, X_CACHE_TAG } from './constants';
import { isPurgeRequestPayload } from './predicates';

export class CacheTag {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env){
    this.state = state;
  }

  async updateTag(tag: string, url: string) {
    const value = await this.state.storage.get<string>(tag);
    let urls = new Set();
    if (value) {
      urls = new Set(JSON.parse(value));
    }

    urls.add(url);

    return this.state.storage.put(tag, JSON.stringify(Array.from(urls)));
  }

  purgeTags(fetcher: cloudflareFetch, zoneId: string, tags: string[]) {
    return from(tags).pipe(
      flatMap(async (tag) => {
        const value = await this.state.storage.get<string>(tag);
        this.state.storage.delete(tag);
        return value;
      }),
      flatMap((value) => {
        if (!value) {
          return EMPTY;
        }

        return from<string>(JSON.parse(value));
      }),
      // Dedupe all of the URLs that need to be purged
      toArray(),
      flatMap((urls) => {
        const urlSet = new Set(urls);

        return from(Array.from(urlSet));
      }),
      bufferCount(30),
      flatMap((files) => (
        fetcher(`zones/${zoneId}/purge_cache`, {
          method: 'POST',
          body: JSON.stringify({
            files,
          })
        })
      )),
      toArray(),
    ).toPromise();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    // Handle Purge Requests.
    if (request.method === 'POST' && url.pathname === '/.cloudflare/purge') {
      const data = await request.json();

      if (!isPurgeRequestPayload(data)) {
        throw new Error('Payload is malformed');
      }

      const { tags } = data;

      const cloudflareFetch = createCloudflareFetch(
        request.headers.get(X_AUTH_EMAIL) || '',
        request.headers.get(X_AUTH_KEY) || ''
      );

      await this.purgeTags(cloudflareFetch, request.headers.get(CF_ZONE) || '', tags);

      return new Response('', {
        status: 200,
      });
    }

    const tagList = request.headers.get(X_CACHE_TAG) || '';

    if (!tagList) {
      return new Response('', {
        status: 400
      });
    }

    const tags = tagList.split(',').reduce<Promise<void>[]>((acc, tag) => {
      const trimmedTag = tag.trim();

      // Ignore empty tags.
      if (trimmedTag === '') {
        return acc;
      }

      acc.push(this.updateTag(trimmedTag, request.url));

      return acc;
    }, []);

    await Promise.all(tags);

    return new Response('', {
      status: 200,
    });
  }
}

interface Env {}
