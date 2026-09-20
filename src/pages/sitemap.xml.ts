import type { APIRoute } from 'astro';
import drivers from '../data/drivers.json';
import standings from '../data/standings.json';
import {
  activeDrivers,
  hasOwnPage,
  hasStandings,
  type Driver,
  type StandingsFile,
} from '../lib/data';

/**
 * The sitemap, generated.
 *
 * It used to be `public/sitemap.xml`, hand-maintained, with a comment at the
 * top reminding whoever added a page to add a `<url>` here too. That held
 * while there were five fixed pages. It stops holding the moment the roster
 * drives the routes: the Discord bot can add a driver without touching this
 * repository's code, and a hand-written list would silently go stale the
 * first time it did.
 *
 * Deliberately not `@astrojs/sitemap`: the rules below - placeholder drivers
 * excluded, per-page changefreq, the 404 left out - are the whole reason
 * this file exists, and the integration would need configuring past all of
 * them to arrive at the same nine lines.
 */

/* The fixed pages and how often each genuinely changes. `/` and `/team` move
   with the data; the rest move when somebody edits copy. `/404` is not here
   on purpose: it is a real file at that path, which a host serves with a
   200, and `Base.astro` marks it `noindex` for the same reason. */
const PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/team', changefreq: 'weekly', priority: '0.8' },
  { path: '/join', changefreq: 'monthly', priority: '0.9' },
  { path: '/partners', changefreq: 'monthly', priority: '0.8' },
  { path: '/about', changefreq: 'yearly', priority: '0.5' },
  /* Indexable on purpose. A privacy page a search engine cannot find is one
     a reader cannot check, and being checkable is the whole point of it. */
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

export const GET: APIRoute = ({ site }) => {
  /* `site` is set in astro.config.mjs. If it ever is not, an absolute URL
     cannot be built and a sitemap of relative paths is worse than none. */
  if (!site) {
    return new Response('Sitemap requires `site` to be set in astro.config.mjs.', {
      status: 500,
    });
  }

  /* Driver pages, minus the placeholders. A page for a driver who does not
     exist yet is fine to build and look at - the roster links to it and it
     renders - but handing invented people to a search engine is not. The
     page itself carries `noindex` from the same flag, so the two agree, and
     both clear themselves when `_placeholder` comes off the record. */
  const driverPages = activeDrivers(drivers as Driver[])
    .filter(hasOwnPage)
    .filter((driver) => driver._placeholder !== true)
    .map((driver) => ({
      path: `/team/${driver.id}`,
      changefreq: 'weekly',
      priority: '0.6',
    }));

  /* /standings exists as a route whether or not there is a table, because a
     page that says "no season is running" is a real answer. It only enters
     the sitemap once it has rows. `standings.astro` sets `noindex` from the
     same condition, so the page and the sitemap cannot disagree. */
  const standingsPages = hasStandings(standings as StandingsFile)
    ? [{ path: '/standings', changefreq: 'daily', priority: '0.9' }]
    : [];

  /* No trailing slashes except on the root: `vercel.json` sets
     trailingSlash false, every internal link uses the bare form, and
     `Base.astro` normalises the canonical tag to match. All three have to
     agree or the site has two live URLs per page. */
  const url = (path: string) => new URL(path, site).href.replace(/(?<!^https?:\/)\/$/, '');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...PAGES, ...standingsPages, ...driverPages]
  .map(
    (page) => `  <url>
    <loc>${page.path === '/' ? site.href : url(page.path)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
