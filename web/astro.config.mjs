// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

const PB_URL = process.env.PB_URL ?? 'http://127.0.0.1:8090';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
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
