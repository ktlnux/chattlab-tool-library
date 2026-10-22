// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import node from '@astrojs/node';

const PB_URL = process.env.PB_URL ?? 'http://127.0.0.1:8090';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  // Geist fonts are downloaded at build time and served from this site.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-geist',
      weights: ['100 900'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif']
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      weights: ['100 900'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace']
    }
  ],
  vite: {
    server: {
      // In development, mirror production's Caddy routing so /api/files/... links work.
      proxy: {
        '/api': PB_URL,
        '^/_(/.*)?$': PB_URL
      }
    }
  }
});
