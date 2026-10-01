import { publicApiUrl } from './env';

/** Uploaded files are stored as /uploads/... and served by the API. Everything else is used as-is. */
export function assetUrl(src: string | undefined): string {
  if (!src) return '';
  return src.startsWith('/uploads/') ? `${publicApiUrl()}${src}` : src;
}
