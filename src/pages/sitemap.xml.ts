import type { APIRoute } from 'astro';
import drivers from '../data/drivers.json';
import events from '../data/events.json';
import results from '../data/results.json';
import standings from '../data/standings.json';
import {
  activeDrivers,
  hasOwnPage,
  hasStandings,
  resultsForDriver,
  type Driver,
  type RaceEvent,
  type RaceResult,
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
interface SitemapPage {
  path: string;
  changefreq: string;
  priority: string;
  /** ISO date, omitted when no dated record on the page backs one. */
  lastmod?: string;
}

/**
 * `<lastmod>`, and the rule for when this file is allowed to emit one.
 *
 * Google ignores `lastmod` across a whole sitemap once it finds the dates
 * untrustworthy - every page stamped with the build time is the usual way
 * that happens, and it costs the signal on the pages where it was real.
 *
 * So a page gets a `lastmod` only when a dated record it actually renders
 * supplies one, and the value is the newest of those dates. Pages made of
 * hand-edited copy - /about, /join, /partners, /privacy, /terms - get none,
 * because nothing in the repository knows when that copy last changed and
 * the build date would be a guess dressed as a fact.
 */
const newest = (...dates: (string | undefined)[]): string | undefined => {
  /* Today, as the build sees it, so a future date can be dropped below. */
  const today = new Date().toISOString().slice(0, 10);

  const valid = dates
    .filter((d): d is string => typeof d === 'string' && !Number.isNaN(Date.parse(d)))
    /* Compared as ISO date strings, which sort correctly, rather than via
       Date objects: `startTime` carries a time and `date` does not, so
       parsing both would silently place a dated-only record at midnight UTC.
       Trimming to the date part compares like with like. */
    .map((d) => d.slice(0, 10))
    /* A date in the future is never a modification date. The calendar is the
       case that matters: an event's `start` is when it will be RACED, not
       when it was added to the file, so the next-race strip would otherwise
       stamp the home page weeks ahead and make every lastmod on the site
       suspect at once. A page whose only dated records are upcoming gets no
       lastmod, which is the correct answer rather than a missing one. */
    .filter((d) => d <= today);

  return valid.length ? valid.sort().at(-1) : undefined;
};

const PAGES: SitemapPage[] = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    /* Home renders the recent-results table and the next-race strip, so the
       newest of those two sets is genuinely when this page last changed. */
    lastmod: newest(
      ...(results as RaceResult[]).map((r) => r.date),
      ...(events as RaceEvent[]).map((e) => e.start)
    ),
  },
  {
    path: '/team',
    changefreq: 'weekly',
    priority: '0.8',
    /* Every roster card prints that driver's last result ("2nd of 41,
       Suzuka 1000, <date>"), so the newest result is genuinely when this
       page last changed. The live iRating on a card comes from stats.json,
       which is generated and uncommitted, so it cannot date anything. */
    lastmod: newest(...(results as RaceResult[]).map((r) => r.date)),
  },
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
      /* This driver's own entries, not the roster's - a page is stale or
         fresh by what it shows, and it shows only their races. A driver
         with no entries yet gets no lastmod rather than the team's. */
      lastmod: newest(
        ...resultsForDriver(results as RaceResult[], driver.name).map((r) => r.date)
      ),
    }));

  /* /standings exists as a route whether or not there is a table, because a
     page that says "no season is running" is a real answer. It only enters
     the sitemap once it has rows. `standings.astro` sets `noindex` from the
     same condition, so the page and the sitemap cannot disagree. */
  const standingsPages = hasStandings(standings as StandingsFile)
    ? [
        {
          path: '/standings',
          changefreq: 'daily',
          priority: '0.9',
          /* Whoever writes the table stamps it; the page prints the same
             field, so the sitemap and the page cannot disagree. */
          lastmod: newest((standings as StandingsFile).updated),
        },
      ]
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
    <loc>${page.path === '/' ? site.href : url(page.path)}</loc>${
      page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ''
    }
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
