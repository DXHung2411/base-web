import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /preview', '', `Sitemap: ${new URL('/sitemap.xml', site).href}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
