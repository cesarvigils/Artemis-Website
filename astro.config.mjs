// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://artemisesports.com',
  trailingSlash: 'ignore',
  build: {
    // "team/index.html" style output uploads cleanly to any static host
    format: 'directory',
    // The whole CSS budget is ~6 KB gzipped across three files. Three
    // render-blocking round trips cost more than the bytes, so it ships
    // in the document instead.
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // The one client module is about 4 KB and grew past Vite's default
      // inline limit in pass 2. Keeping it in the document costs a few
      // duplicated bytes per page and buys back a request that cannot 404.
      assetsInlineLimit: 8192,
    },
  },
});
