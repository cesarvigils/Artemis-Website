import type { APIRoute } from 'astro';
import site from '../data/site.json';

/**
 * The web app manifest, generated.
 *
 * WHY IT EXISTS AT ALL
 *   `vercel.json`'s Content-Security-Policy has carried `manifest-src
 *   'self'` since the headers were written, while no manifest was ever
 *   served - a directive permitting a resource that did not exist. That is
 *   the kind of drift that makes a CSP hard to trust later: a reader
 *   cannot tell which directives are load-bearing and which are leftovers.
 *   Either the directive goes or the manifest arrives, and the manifest is
 *   worth having.
 *
 * WHAT IT BUYS
 *   An installed or pinned shortcut gets the team's name, mark and ground
 *   colour instead of a screenshot and a truncated URL, and a browser that
 *   supports it stops guessing those from the document. It also gives the
 *   icons one declaration a crawler can read, rather than four `<link>`
 *   tags whose relationship is implicit.
 *
 *   It is not a ranking factor and is not claimed as one.
 *
 * WHY GENERATED RATHER THAN A FILE IN public/
 *   `name`, `theme_color` and `background_color` all duplicate values that
 *   already exist - in `site.json` and in the `--night` token echoed by the
 *   `theme-color` meta. A static file would be a fifth place to forget.
 *   Generating it means the team name is edited once.
 *
 * The icon set is the one `scripts/build-icons.mjs` produces, and the size
 * split is that script's rule: the notched A below 96px where the hero
 * mark's leaf tips collapse, the hero mark at 180 and 192 where they do
 * not. `purpose: "maskable"` is deliberately NOT claimed - these marks have
 * no safe-zone padding, so an Android launcher would crop into the glyph.
 */
export const GET: APIRoute = () =>
  new Response(
    `${JSON.stringify(
      {
        name: site.name,
        short_name: site.team,
        description: site.shortDescription,
        start_url: '/',
        scope: '/',
        display: 'standalone',
        /* Must track `--night` in global.css and the `theme-color` meta in
           Base.astro. CSS custom properties cannot be read from here. */
        theme_color: '#0a0e0d',
        background_color: '#0a0e0d',
        lang: 'en-GB',
        dir: 'ltr',
        categories: ['sports', 'games'],
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      null,
      2
    )}\n`,
    {
      headers: {
        /* The registered type. Serving it as application/json works in
           practice but is not what the spec says, and some validators
           reject it. */
        'Content-Type': 'application/manifest+json; charset=utf-8',
      },
    }
  );
