#!/usr/bin/env node
/**
 * The head's machine-readable contract: JSON-LD, canonical, robots and the
 * sitemap, checked against the built `dist/`.
 *
 * WHY THIS IS A SCRIPT AND NOT A PLAYWRIGHT SPEC
 *   None of it needs a browser. These are assertions about bytes in the
 *   emitted HTML, and a headless Chromium per route to read a `<script>`
 *   tag is a minute of CI for something `readFileSync` answers instantly.
 *   Same reasoning as empty-data-build.mjs and the sync suite.
 *
 * WHY IT PROMOTES A DRIVER MID-RUN
 *   The interesting half of the structured data is switched off today.
 *   Every driver in `drivers.json` carries `_placeholder: true`, so the
 *   `Person` node and the indexable-driver-page path never execute, and
 *   the first time they will is on a production deploy with real names in
 *   the file - which is the worst possible moment to discover a typo in a
 *   schema key.
 *
 *   So this does what empty-data-build.mjs does: mutates `src/data` in
 *   place, rebuilds, asserts, and restores in a `finally` so the tree is
 *   byte-identical afterwards even when an assertion throws. It promotes
 *   exactly one driver by deleting `_placeholder`, which is precisely the
 *   edit that publishing a real driver will make.
 *
 * WHY IT BUILDS FIRST RATHER THAN TRUSTING dist/
 *   It builds three times: the shipping state, the promoted state, then
 *   the restore. The first one is not redundant. Reading whatever `dist/`
 *   happens to contain makes the result depend on what the last command in
 *   the working tree left behind - which passes on a developer's machine,
 *   where a build just ran, and fails on a clean CI checkout, where there
 *   is no `dist/` at all. That is precisely how this file failed its own
 *   first CI run. Owning the build makes the check depend on the source
 *   and nothing else, and is why the job needs no `needs: build`.
 *
 * Wired as `test:seo` in tests/package.json. Run from anywhere; paths
 * resolve relative to this file, not the working directory.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..');
const DIST = path.join(ROOT, 'dist');
const DRIVERS = path.join(ROOT, 'src', 'data', 'drivers.json');
const EVENTS = path.join(ROOT, 'src', 'data', 'events.json');
const SITE = 'https://artemisesports.com';

let failures = 0;
function check(label, fn) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
  } catch (error) {
    console.error(`  FAIL  ${label}\n          ${error.message}`);
    failures += 1;
  }
}

const read = (rel) => {
  const file = path.join(DIST, rel);
  if (!existsSync(file)) throw new Error(`no ${rel} in dist/ after a build - the route is missing.`);
  return readFileSync(file, 'utf8');
};

function run(command) {
  return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
}

/**
 * Every ld+json block in a document, parsed. Parsing is the point: a block
 * that is not valid JSON is invisible to a crawler and looks fine in a
 * diff, which is the failure this exists to catch.
 */
function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (match, index) => {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        throw new Error(`ld+json block ${index + 1} is not valid JSON: ${error.message}`);
      }
    }
  );
}

const graphOf = (html) => {
  const blocks = jsonLd(html);
  if (blocks.length !== 1) throw new Error(`expected exactly 1 ld+json block, found ${blocks.length}`);
  const [block] = blocks;
  if (block['@context'] !== 'https://schema.org') throw new Error('block has no schema.org @context');
  if (!Array.isArray(block['@graph'])) throw new Error('block has no @graph array');
  return block['@graph'];
};

const nodeOf = (graph, type) => {
  const node = graph.find((n) => n['@type'] === type);
  if (!node) throw new Error(`no ${type} node (graph holds: ${graph.map((n) => n['@type']).join(', ')})`);
  return node;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

/* ---- What ships today: placeholders everywhere ------------------- */

/* From the committed source, not from whatever was in dist/ already. */
try {
  run('npm run build');
} catch (error) {
  console.error('seo-structured-data: the initial build failed, so there is nothing to check.');
  console.error(String(error.stdout ?? '') + String(error.stderr ?? ''));
  process.exit(1);
}

console.log('\nAs the site ships (every driver a placeholder):\n');

check('home emits one valid ld+json block holding a SportsTeam', () => {
  const org = nodeOf(graphOf(read('index.html')), 'SportsTeam');
  assert(org['@id'] === `${SITE}/#organization`, `org @id is ${org['@id']}`);
});

check('the WebSite node names the organisation as its publisher', () => {
  const graph = graphOf(read('index.html'));
  const website = nodeOf(graph, 'WebSite');
  const org = nodeOf(graph, 'SportsTeam');
  assert(website.publisher?.['@id'] === org['@id'], `publisher is ${JSON.stringify(website.publisher)}`);
  assert(website.inLanguage === 'en-GB', `inLanguage is ${website.inLanguage}`);
  /* SearchAction makes a site eligible for the sitelinks search box and
     takes a URL template pointing at a real search endpoint. There is no
     search route here, so declaring one would resolve to a 404. */
  assert(!website.potentialAction, 'WebSite declares a SearchAction, but the site has no search route');
});

check('no placeholder event is asserted as a scheduled race', () => {
  const graph = graphOf(read('index.html'));
  const events = graph.filter((n) => n['@type'] === 'SportsEvent');
  const source = JSON.parse(readFileSync(path.join(ROOT, 'src', 'data', 'events.json'), 'utf8'));
  const placeholderNames = source.filter((e) => e._placeholder === true).map((e) => e.name);
  const leaked = events.filter((e) => placeholderNames.includes(e.name));
  assert(leaked.length === 0, `placeholder events in structured data: ${leaked.map((e) => e.name).join(', ')}`);
});

check('partner links carry rel="sponsored"', () => {
  const html = read('partners/index.html');
  const partners = JSON.parse(readFileSync(path.join(ROOT, 'src', 'data', 'partners.json'), 'utf8'));
  for (const partner of partners) {
    const anchors = [...html.matchAll(new RegExp(`<a\\b[^>]*href="${partner.url}"[^>]*>`, 'g'))].map((m) => m[0]);
    assert(anchors.length > 0, `no link to ${partner.name} on /partners`);
    /* A sponsorship link left plainly followed is what a link-spam manual
       action looks for. The team's own socials and store stay followed. */
    for (const anchor of anchors) {
      assert(/rel="[^"]*\bsponsored\b/.test(anchor), `${partner.name} link is missing rel="sponsored": ${anchor}`);
    }
  }
});

check('driver descriptions are distinct from one another', () => {
  const drivers = JSON.parse(readFileSync(DRIVERS, 'utf8'));
  const seen = new Map();
  for (const driver of drivers) {
    const file = path.join(DIST, 'team', driver.id, 'index.html');
    if (!existsSync(file)) continue;
    const description = (readFileSync(file, 'utf8').match(/<meta name="description" content="([^"]*)"/) ?? [])[1];
    assert(description, `${driver.id} has no meta description`);
    /* Eight roster pages whose descriptions differ only by a name is the
       thin-content shape a roster is most likely to produce. */
    assert(!seen.has(description), `${driver.id} and ${seen.get(description)} share a description`);
    seen.set(description, driver.id);
  }
  assert(seen.size > 1, 'fewer than two driver pages were built');
});

check('home declares og:type website and a canonical without a trailing slash', () => {
  const html = read('index.html');
  assert(html.includes('<meta property="og:type" content="website">'), 'og:type is not website');
  assert(html.includes(`<link rel="canonical" href="${SITE}/">`), 'canonical missing or not the bare root');
});

check('html lang and og:locale agree, and both say en-GB', () => {
  const html = read('index.html');
  assert(html.includes('lang="en-GB"'), 'html lang is not en-GB');
  assert(html.includes('content="en_GB"'), 'og:locale is not en_GB');
});

check('a placeholder driver page is noindex and asserts nothing at all', () => {
  const html = read('team/mateo-ferreira/index.html');
  assert(/name="robots" content="noindex/.test(html), 'not marked noindex');
  assert(
    jsonLd(html).length === 0,
    'a noindex page emitted structured data - a document a crawler is told to skip must not assert facts'
  );
  assert(!html.includes('rel="canonical"'), 'a noindex page should not claim a canonical URL');
});

check('the 404 document is noindex and absent from the sitemap', () => {
  assert(/name="robots" content="noindex/.test(read('404.html')), '404 is not noindex');
  assert(!read('sitemap.xml').includes('/404'), '404 is listed in the sitemap');
});

check('no placeholder driver reaches the sitemap', () => {
  const sitemap = read('sitemap.xml');
  const drivers = JSON.parse(readFileSync(DRIVERS, 'utf8'));
  const leaked = drivers.filter((d) => d._placeholder === true && sitemap.includes(`/team/${d.id}<`));
  assert(leaked.length === 0, `placeholders in sitemap: ${leaked.map((d) => d.id).join(', ')}`);
});

check('every sitemap lastmod is a plain ISO date, and none is in the future', () => {
  const sitemap = read('sitemap.xml');
  const today = new Date().toISOString().slice(0, 10);
  const stamps = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  for (const stamp of stamps) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(stamp), `lastmod "${stamp}" is not a bare YYYY-MM-DD`);
    /* The one that actually bites: an event's `start` is when a race will
       be RUN, not when the page changed, so the calendar would otherwise
       stamp the home page weeks ahead. Google discards lastmod across a
       whole sitemap once it finds the dates untrustworthy. */
    assert(stamp <= today, `lastmod "${stamp}" is in the future (today is ${today})`);
  }
  assert(stamps.length > 0, 'no lastmod anywhere - the dated pages should carry one');
});

/* ---- What happens the day a real driver is published ------------- */

console.log('\nWith one driver promoted to real (restored afterwards):\n');

const originalDrivers = readFileSync(DRIVERS, 'utf8');
const originalEvents = readFileSync(EVENTS, 'utf8');
let promoted;
let promotedEvent;

try {
  const drivers = JSON.parse(originalDrivers);
  promoted = drivers.find((d) => d._placeholder === true && d.role !== 'pitwall');
  if (!promoted) throw new Error('no placeholder driver to promote');
  delete promoted._placeholder;
  writeFileSync(DRIVERS, `${JSON.stringify(drivers, null, 2)}\n`);

  /* One event too, in the same build rather than a second promotion pass:
     the SportsEvent path is switched off for exactly the same reason the
     Person path is, and rebuilding twice to prove two independent gates
     costs a build for nothing. */
  const events = JSON.parse(originalEvents);
  promotedEvent = events.find((e) => e._placeholder === true);
  if (!promotedEvent) throw new Error('no placeholder event to promote');
  delete promotedEvent._placeholder;
  writeFileSync(EVENTS, `${JSON.stringify(events, null, 2)}\n`);

  run('npm run build');

  const html = read(`team/${promoted.id}/index.html`);
  const graph = graphOf(html);

  check(`${promoted.name}'s page is indexable and in the sitemap`, () => {
    assert(!/name="robots" content="noindex/.test(html), 'still noindex');
    assert(html.includes('rel="canonical"'), 'no canonical');
    assert(read('sitemap.xml').includes(`/team/${promoted.id}<`), 'missing from sitemap');
  });

  check('it declares og:type profile, not website', () => {
    assert(html.includes('<meta property="og:type" content="profile">'), 'og:type is not profile');
  });

  check('the breadcrumb trail is Home > Team > driver', () => {
    const crumbs = nodeOf(graph, 'BreadcrumbList').itemListElement;
    const names = crumbs.map((c) => c.name);
    assert(names.join(' > ') === `Home > Team > ${promoted.name}`, `trail is ${names.join(' > ')}`);
    crumbs.forEach((crumb, index) => {
      assert(crumb.position === index + 1, `crumb ${index + 1} has position ${crumb.position}`);
    });
    /* The last crumb is the page itself; carrying an `item` would make it
       link to self, which is what tells a parser the trail has not ended. */
    assert(!crumbs.at(-1).item, 'the final crumb carries an item');
    for (const crumb of crumbs.filter((c) => c.item)) {
      assert(crumb.item.startsWith(SITE), `crumb item ${crumb.item} is not absolute`);
      assert(
        crumb.item === `${SITE}/` || !crumb.item.endsWith('/'),
        `crumb item ${crumb.item} has a trailing slash the canonical form does not`
      );
    }
  });

  check('the Person node attaches to the organisation in the same graph', () => {
    const person = nodeOf(graph, 'Person');
    const org = nodeOf(graph, 'SportsTeam');
    assert(person.name === promoted.name, `Person.name is ${person.name}`);
    assert(person['@id'] === `${SITE}/team/${promoted.id}#person`, `Person @id is ${person['@id']}`);
    assert(person.url === `${SITE}/team/${promoted.id}`, `Person.url is ${person.url}`);
    /* The whole reason both live in one @graph rather than two script
       tags: nodes in separate blocks cannot resolve each other's @id. */
    assert(
      person.memberOf?.['@id'] === org['@id'],
      `Person.memberOf is ${JSON.stringify(person.memberOf)}, org is ${org['@id']}`
    );
  });

  check('the Person node claims nothing the record does not hold', () => {
    const person = nodeOf(graph, 'Person');
    for (const key of ['image', 'birthDate', 'award', 'aggregateRating']) {
      assert(!(key in person), `Person carries "${key}", which drivers.json has no source for`);
    }
    if (person.nationality) assert(person.nationality === promoted.country, 'nationality does not match the record');
  });

  check(`"${promotedEvent.name}" is now asserted as a scheduled SportsEvent`, () => {
    const graph = graphOf(read('index.html'));
    const event = graph.find((n) => n['@type'] === 'SportsEvent' && n.name === promotedEvent.name);
    assert(event, `no SportsEvent for ${promotedEvent.name}`);
    assert(
      event.startDate === (promotedEvent.startTime ?? promotedEvent.start),
      `startDate is ${event.startDate}, record says ${promotedEvent.startTime ?? promotedEvent.start}`
    );
    /* A sim race happens on iRacing, not at the circuit whose name it
       borrows, so it must never carry a physical address. */
    assert(event.location?.['@type'] === 'VirtualLocation', `location is ${JSON.stringify(event.location)}`);
    assert(
      event.competitor?.['@id'] === `${SITE}/#organization`,
      `competitor is ${JSON.stringify(event.competitor)}`
    );
    const others = JSON.parse(readFileSync(EVENTS, 'utf8')).filter((e) => e._placeholder === true);
    const names = graph.filter((n) => n['@type'] === 'SportsEvent').map((n) => n.name);
    const leaked = others.filter((e) => names.includes(e.name));
    assert(leaked.length === 0, `promoting one event leaked others: ${leaked.map((e) => e.name).join(', ')}`);
  });

  check('the other drivers are still placeholders and still excluded', () => {
    const sitemap = read('sitemap.xml');
    const others = JSON.parse(readFileSync(DRIVERS, 'utf8')).filter((d) => d._placeholder === true);
    assert(others.length > 0, 'promotion emptied the placeholder set');
    const leaked = others.filter((d) => sitemap.includes(`/team/${d.id}<`));
    assert(leaked.length === 0, `promoting one leaked others: ${leaked.map((d) => d.id).join(', ')}`);
  });
} catch (error) {
  console.error(`  FAIL  promoted-driver setup: ${error.message}`);
  failures += 1;
} finally {
  writeFileSync(DRIVERS, originalDrivers);
  writeFileSync(EVENTS, originalEvents);
  console.log('\n  restored src/data/drivers.json and events.json');
}

check('the restore put both data files back byte-for-byte', () => {
  assert(readFileSync(DRIVERS, 'utf8') === originalDrivers, 'drivers.json differs from before the run');
  assert(readFileSync(EVENTS, 'utf8') === originalEvents, 'events.json differs from before the run');
});

/* Leave dist/ built from the real data, not the promoted run. Best-effort:
   never affects the exit code. */
try {
  run('npm run build');
} catch {
  console.error('  warning - the cleanup rebuild failed; the results above still stand.');
}

console.log(
  failures === 0
    ? '\nseo-structured-data: all checks passed.\n'
    : `\nseo-structured-data: ${failures} check(s) failed.\n`
);
process.exit(failures === 0 ? 0 : 1);
