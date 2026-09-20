import type { APIRoute } from 'astro';
import results from '../data/results.json';
import site from '../data/site.json';
import { sortResults, type RaceResult } from '../lib/data';

/**
 * The results feed, generated.
 *
 * WHY A FEED ON A SITE WITH NO BLOG
 *   A feed is not a blog format, it is a change format, and this site has
 *   exactly one stream of change worth subscribing to: results. The first
 *   brand commitment is "every race we enter goes public within 48 hours",
 *   and a feed is the machine-readable version of that promise - it lets a
 *   reader, an aggregator, or a Discord webhook learn a result landed
 *   without polling the home page.
 *
 *   It is also a discovery surface in its own right. Feed readers and
 *   aggregators crawl feeds directly, and `rel="alternate"` in the document
 *   head is a standard signal pointing at the canonical stream.
 *
 * WHY HAND-WRITTEN RATHER THAN @astrojs/rss
 *   Same reasoning the sitemap route records: the rules here - placeholder
 *   exclusion, the GUID scheme, the description built from the result's own
 *   fields - are the whole content of the file, and the integration would
 *   need configuring past all of them to arrive at the same output. One
 *   fewer dependency on a site whose dependency list is deliberately short.
 *
 * THE EMPTY CASE IS THE CURRENT CASE
 *   Every record in results.json is `_placeholder: true`, and an invented
 *   race must not be syndicated any more than it may be indexed, so the
 *   feed ships empty and fills itself the moment real results land. A
 *   channel with no items is valid RSS 2.0 - the spec requires the channel
 *   metadata, not the items - so readers see an empty feed rather than an
 *   error, and a subscription taken today still works on the first real
 *   result.
 */

/** XML text escaping. Every value below is team-authored, but a track or
 *  event name carrying an ampersand is entirely ordinary and would produce
 *  a feed no parser accepts. */
const xml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** RFC 822, which RSS 2.0 requires - not the ISO dates the data files use.
 *  A date-only record becomes midday UTC rather than midnight: the entry is
 *  a race result whose exact time the file does not record, and midday
 *  keeps it on the intended day in every timezone a reader might be in. */
const rfc822 = (date: string): string => new Date(`${date}T12:00:00Z`).toUTCString();

const ordinal = (position: number): string => {
  const teens = position % 100;
  if (teens >= 11 && teens <= 13) return `${position}th`;
  return `${position}${['th', 'st', 'nd', 'rd'][position % 10] ?? 'th'}`;
};

export const GET: APIRoute = ({ site: base }) => {
  if (!base) {
    return new Response('Feed requires `site` to be set in astro.config.mjs.', { status: 500 });
  }

  const published = sortResults(results as RaceResult[]).filter(
    (result) => result._placeholder !== true
  );

  const items = published
    .map((result) => {
      const finish = `${ordinal(result.position)}${result.entries ? ` of ${result.entries}` : ''}`;
      const summary = [
        `${finish} in the ${result.class} class at ${result.track}.`,
        result.drivers.length ? `Drivers: ${result.drivers.join(', ')}.` : '',
        result.note ?? '',
      ]
        .filter(Boolean)
        .join(' ');

      return `    <item>
      <title>${xml(`${result.event}: ${finish}`)}</title>
      <link>${xml(new URL('/#scoreboard', base).href)}</link>
      <description>${xml(summary)}</description>
      <category>${xml(result.series)}</category>
      <pubDate>${rfc822(result.date)}</pubDate>
      <!-- isPermaLink="false": the id identifies the result, and no page is
           served at that address. Without it a reader treats the guid as a
           URL and may try to fetch it. -->
      <guid isPermaLink="false">${xml(`artemis:result:${result.id}`)}</guid>
    </item>`;
    })
    .join('\n');

  /* The channel's own date is the newest result, not the build time. A
     feed restamped on every deploy tells a reader something changed when
     nothing did, which is the same mistake a build-time sitemap lastmod
     makes. With no results there is no honest date, so the element is
     omitted rather than filled in. */
  const latest = published[0]?.date;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(`${site.name} results`)}</title>
    <link>${xml(base.href)}</link>
    <description>${xml(`Race results for ${site.name}. ${site.tagline}`)}</description>
    <language>en-gb</language>
    <atom:link href="${xml(new URL('/feed.xml', base).href)}" rel="self" type="application/rss+xml" />${
      latest ? `\n    <lastBuildDate>${rfc822(latest)}</lastBuildDate>` : ''
    }
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
