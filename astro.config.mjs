// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://artemisesports.com',
  trailingSlash: 'ignore',
  build: {
    // "team/index.html" style output uploads cleanly to any static host
    format: 'directory',
  },
});
