import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mlunaelectricinc.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    sitemap(),
  ],
});
