import { PurgeRequestPayload } from "./types";

export function isPurgeRequestPayload(input: unknown): input is PurgeRequestPayload {
  return typeof input === 'object' && input !== null && 'tags' in input;
}
