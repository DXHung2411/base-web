import { defineMiddleware } from 'astro:middleware';
import { brotliCompress, gzip } from 'node:zlib';
import { promisify } from 'node:util';

const compressBrotli = promisify(brotliCompress);
const compressGzip = promisify(gzip);

/**
 * Adds baseline security headers, and compresses HTML responses. The standalone Node server does not
 * compress, and HTML is the largest payload now that CSS is inlined. A reverse proxy in front will
 * leave an already-encoded body alone.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // The admin preview embeds the site from the same origin, so same-origin framing is allowed.
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const acceptEncoding = context.request.headers.get('accept-encoding') ?? '';
  const isHtml = response.headers.get('content-type')?.startsWith('text/html');
  if (!isHtml || response.headers.has('content-encoding') || !response.body) return response;

  const encoding = acceptEncoding.includes('br') ? 'br' : acceptEncoding.includes('gzip') ? 'gzip' : null;
  if (!encoding) return response;

  const html = Buffer.from(await response.arrayBuffer());
  const body = encoding === 'br' ? await compressBrotli(html) : await compressGzip(html);

  const headers = new Headers(response.headers);
  headers.set('content-encoding', encoding);
  headers.set('content-length', String(body.length));
  headers.append('vary', 'Accept-Encoding');
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
});
