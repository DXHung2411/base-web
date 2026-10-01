import node from '@astrojs/node';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [preact()],
  site: process.env.SITE_URL || 'http://localhost:4321',
  server: { port: 4321 },
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
