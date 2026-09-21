#!/usr/bin/env node
/**
 * THE SIGNAL BUDGET, MEASURED.
 *
 * `docs/brand-core.md` section 6 gives Signal a budget of 5-10% of a layout,
 * and `DESIGN.md` section 2 says the number is "measured, not asserted" and
 * names this file. This file did not exist. The 5.4% worst-screen figure in
 * `docs/pass6-report.md` was therefore a claim about a measurement nobody
 * could repeat, which is the thing the budget was invented to prevent.
 *
 * Rebuilt to the method the pass-6 report documents, so the numbers it
 * produced stay comparable:
 *
 *   A pixel counts as Signal when `g >= 120`, `g - r >= 60`, `b - r >= 40`
 *   and `g - b >= 12`.
 *
 * That window catches pure `#0FFFCF` and every anti-aliased blend of it
 * toward Night, and excludes Mist (`g-r` is 20), `--muted` (25) and
 * `--muted-deep` (35).
 *
 * ONE CONDITION THE REPORT DOES NOT HAVE: `g - b <= 60`.
 *   The four conditions above were written in pass 6, before the NOCTURNE
 *   migration added the data colours. `--gain #5BD98A` satisfies all four
 *   (`g-r` 126, `b-r` 47, `g-b` 79), so the documented window counts every
 *   position-gained marker as accent - and `docs/brand-core.md` section 6
 *   says in as many words that the data colours "sit outside the Signal
 *   budget", because they label a value rather than direct the eye.
 *
 *   Signal and its hover span `g-b` 48 and 28, and blending either toward
 *   Night only lowers it, so a ceiling of 60 excludes gain and everything
 *   between it and Night without touching a single accent pixel.
 *
 * The thresholds are asserted against the real token values at startup, so
 * a palette change that breaks the window fails here instead of silently
 * reporting a comforting number.
 *
 * Photographs are hidden with `visibility: hidden` rather than
 * `display: none`, which preserves layout exactly, so the number describes
 * the DESIGN and not the teal liveries in the car renders.
 *
 * WHY THE PIXELS ARE COUNTED IN THE BROWSER
 *   Node has no PNG decoder in its standard library, and this tool is not
 *   worth a dependency. Chromium already has one: the screenshot goes back
 *   in as an <img>, onto a canvas, and `getImageData` hands over the exact
 *   bytes. No decoding, nothing to keep in sync.
 *
 * Usage:  node audit-tool/signal6.mjs [--json] [--cap 10]
 * Exits non-zero if any screen exceeds the cap.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/* Playwright is a test dependency and lives in `tests/node_modules`; this
   file sits outside it, so resolve from there explicitly rather than
   relying on directory walking that only works by accident. */
const require = createRequire(new URL('../tests/package.json', import.meta.url));
const { chromium } = require('playwright');
const { createServer } = await import(new URL('../tests/server.mjs', import.meta.url));

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const DIST = path.join(ROOT, 'dist');
const PORT = 4399;

const args = process.argv.slice(2);
const AS_JSON = args.includes('--json');
const CAP = Number(args[args.indexOf('--cap') + 1]) || 10;

/* `docs/pass6-report.md` section 1.3, plus the `g - b` ceiling that keeps
   the data colours out. See the header. */
const isSignal = (r, g, b) =>
  g >= 120 && g - r >= 60 && b - r >= 40 && g - b >= 12 && g - b <= 60;

/* Guard the window against a palette change. Signal must land inside it and
   every non-accent token must land outside, or the tool reports a comforting
   zero while the budget quietly drifts. */
function selfTest() {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const must = [
    ['--signal #0FFFCF', '#0FFFCF', true],
    ['--signal-hover #7DFFE3', '#7DFFE3', true],
    ['--mist #E8F0EE', '#E8F0EE', false],
    ['--muted #93A5A1', '#93A5A1', false],
    ['--muted-deep #6B7C78', '#6B7C78', false],
    /* Accent family, so it counts: if area-accent were exempt, a screen
       could be flooded with it and the meter would still report 0%. */
    ['--signal-deep #08A88A', '#08A88A', true],
    ['--night #0A0E0D', '#0A0E0D', false],
    ['--gain #5BD98A', '#5BD98A', false],
    ['--info #6FB6E8', '#6FB6E8', false],
  ];
  const bad = must.filter(([, h, want]) => isSignal(...hex(h)) !== want);
  if (bad.length) {
    console.error('signal6: the detection window no longer matches the palette:');
    for (const [name, , want] of bad) {
      console.error(`  ${name} should ${want ? '' : 'not '}count as Signal, and does${want ? ' not' : ''}`);
    }
    process.exit(2);
  }
}

/** Every built route, from `dist` itself, so a new page is covered the day it ships. */
function routes(dir = DIST, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === '_astro' || entry.name === 'fonts') continue;
    const next = path.join(dir, entry.name);
    if (fs.existsSync(path.join(next, 'index.html'))) out.push(`${base}/${entry.name}`);
    out.push(...routes(next, `${base}/${entry.name}`));
  }
  return out;
}

const HIDE_PHOTOS = () => {
  const sel = 'img, picture, video, canvas, svg image, [style*="background-image"]';
  for (const el of document.querySelectorAll(sel)) el.style.visibility = 'hidden';
};

/* Decoding happens on a blank page of its own, never on the page being
   measured: a multi-megabyte data URL handed to a page that is still
   settling gets its evaluate promise collected out from under it. */
async function countSignal(page, shot) {
  return page.evaluate(
    ([dataUrl, fn]) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.width;
          c.height = img.height;
          const ctx = c.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          const { data } = ctx.getImageData(0, 0, c.width, c.height);
          const test = new Function('return ' + fn)();
          let hit = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (test(data[i], data[i + 1], data[i + 2])) hit++;
          }
          resolve({ hit, total: data.length / 4 });
        };
        img.onerror = () => reject(new Error('screenshot failed to decode'));
        img.src = dataUrl;
      }),
    ['data:image/png;base64,' + shot.toString('base64'), isSignal.toString()]
  );
}

selfTest();

if (!fs.existsSync(DIST)) {
  console.error('signal6: no dist/. Run `npm run build` first.');
  process.exit(2);
}

const server = createServer({ distDir: DIST, vercelJsonPath: path.join(ROOT, 'vercel.json') });
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch();
const meter = await browser.newPage();
await meter.setContent('<!doctype html><title>signal6</title>');
const rows = [];

for (const route of ['/', ...routes()].filter((r, i, a) => a.indexOf(r) === i)) {
  for (const [label, width, height] of [
    ['1440', 1440, 900],
    ['390', 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'load' });
    /* Settle any reveal-on-scroll content before measuring, then return to
       the top so the hero capture is the hero. */
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 20));
      }
      window.scrollTo(0, 0);
    });
    await page.evaluate(HIDE_PHOTOS);
    await page.waitForTimeout(250);

    const hero = await countSignal(meter, await page.screenshot());
    const full = await countSignal(meter, await page.screenshot({ fullPage: true }));
    rows.push({
      route,
      width: label,
      hero: (hero.hit / hero.total) * 100,
      full: (full.hit / full.total) * 100,
    });
    await page.close();
  }
}

await browser.close();
server.close();

const worst = rows.reduce((a, b) => (Math.max(b.hero, b.full) > Math.max(a.hero, a.full) ? b : a));
const worstPct = Math.max(worst.hero, worst.full);

if (AS_JSON) {
  console.log(JSON.stringify({ cap: CAP, worst: { ...worst, pct: worstPct }, rows }, null, 2));
} else {
  const pad = Math.max(...rows.map((r) => r.route.length), 5);
  console.log(`\n  ${'route'.padEnd(pad)}  width   hero    full`);
  console.log(`  ${'-'.repeat(pad)}  -----  ------  ------`);
  for (const r of rows) {
    console.log(
      `  ${r.route.padEnd(pad)}  ${r.width.padStart(5)}  ${r.hero.toFixed(2).padStart(5)}%  ${r.full.toFixed(2).padStart(5)}%`
    );
  }
  console.log(
    `\n  worst screen: ${worstPct.toFixed(2)}% on ${worst.route} at ${worst.width} (cap ${CAP}%)`
  );
  /* The floor is as real as the cap: Signal at 0% everywhere means the accent
     stopped doing its job, which no other check on this site would notice. */
  if (worstPct < 1) console.log('  note: nothing on the site reaches 1% Signal. The accent is not landing.');
}

if (worstPct > CAP) {
  console.error(`\nsignal6: ${worstPct.toFixed(2)}% exceeds the ${CAP}% cap.`);
  process.exit(1);
}
/* `--json` means the whole of stdout is the document. A closing human line
   here makes the output unparseable, which it was. */
if (!AS_JSON) console.log('\nsignal6: within budget.\n');
