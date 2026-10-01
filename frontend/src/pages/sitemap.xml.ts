import type { APIRoute } from 'astro';
import { getPublicSettings, listPublicPages } from '../lib/api';
import { getSiteConfig } from '../lib/settingDefs';

export const GET: APIRoute = async ({ site }) => {
  const [pages, settings] = await Promise.all([listPublicPages(), getPublicSettings()]);
  const homeSlug = getSiteConfig(settings)['site.homeSlug'];

  const entries = pages.map((page) => {
    const loc = new URL(page.slug === homeSlug ? '/' : `/${page.slug}`, site).href;
    return `  <url><loc>${loc}</loc><lastmod>${new Date(page.updatedAt + 'Z').toISOString()}</lastmod></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
};
