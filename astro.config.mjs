import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mlunaelectric.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    sitemap(),
  ],
});
