#!/usr/bin/env node
/**
 * Lighthouse floor check against the built `dist/`.
 *
 * Runs `/` and `/team` (the two heaviest pages: hero LCP image, the
 * results table, the garage carousel, the countdown) on the mobile form
 * factor, and enforces:
 *   - performance   >= 95   Not 100 on purpose: CI runners are shared,
 *                           noisy VMs, and a couple of points of jitter
 *                           on a static, mostly-inlined site is not a
 *                           real regression. 95 still catches an actual
 *                           budget break (an unlazied image, a blocking
 *                           script) while not flaking on scheduler noise.
 *   - accessibility = 100
 *   - best-practices = 100
 *   - seo           = 100
 *
 * WHY A MEDIAN, AND WHY ONLY SOMETIMES
 *   The 95 floor was not generous enough on its own. A single Lighthouse
 *   sample measures one page load on a shared runner, and when several CI
 *   runs start at once the contention lands on whichever page has the
 *   heaviest LCP - here the home page's full-bleed hero image. One such
 *   run scored `/` at 84 while `/team` scored 100 in the same job and
 *   every non-timing category scored 100 on both routes. Nothing had
 *   regressed; the sample was noise, and noise that red-ticks a PR costs
 *   a review cycle and teaches people to re-run rather than read.
 *
 *   Raising the floor would hide real regressions. Sampling fixes the
 *   measurement instead: a median of three is robust to one bad load,
 *   because two of the three have to agree before the verdict moves.
 *
 *   Extra samples are only taken when the first one FAILS. A passing run
 *   is already evidence the floors are met, so the common path still
 *   costs one load per route and the job stays as fast as it was. Only a
 *   failing route pays for the certainty, which is exactly when it is
 *   worth paying.
 *
 *   `LH_SAMPLES` (default 3) sets how many samples a failing route takes.
 *   Set it to 1 to restore the old single-shot behaviour.
 *
 * Chrome resolution order:
 *   1. CHROME_PATH env var - the project's own local-run convention.
 *   2. Playwright's installed Chromium (playwright-core, a transitive dep
 *      of @playwright/test) - what CI uses, after
 *      `npx playwright install --with-deps chromium`.
 *   3. chrome-launcher's own system auto-detect, as a last resort.
 *
 * Serves dist/ itself via tests/server.mjs (with vercel.json's headers
 * applied) rather than depending on Playwright's webServer lifecycle, so
 * this can run standalone in its own CI job.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { createServer, DIST_DIR } from './server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const OUT_DIR = path.join(here, '.lighthouse');
const PORT = Number(process.env.LH_PORT) || 4544;
const ROUTES = ['/', '/team'];

/* How many samples a FAILING route is re-measured with. A passing route
   always costs exactly one. Clamped to at least 1 so a bad env value
   cannot disable the check itself. */
const SAMPLES = Math.max(1, Number(process.env.LH_SAMPLES) || 3);

const FLOORS = {
  performance: 95,
  accessibility: 100,
  'best-practices': 100,
  seo: 100,
};

function resolveChromePath() {
  if (process.env.CHROME_PATH) {
    console.log(`lighthouse: using CHROME_PATH=${process.env.CHROME_PATH}`);
    return process.env.CHROME_PATH;
  }
  try {
    const { chromium } = require('playwright-core');
    const candidate = chromium.executablePath();
    if (candidate && fs.existsSync(candidate)) {
      console.log(`lighthouse: using Playwright's Chromium at ${candidate}`);
      return candidate;
    }
  } catch {
    // Not installed / not resolvable - fall through to chrome-launcher.
  }
  console.log("lighthouse: no CHROME_PATH and no Playwright Chromium found; letting chrome-launcher search the system.");
  return undefined;
}

/**
 * The lower median: for an even sample count it takes the lower of the two
 * middle values rather than averaging them. Scores are integers and this
 * check should round against itself, not in its own favour.
 */
function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[(sorted.length - 1) >> 1];
}

const scoresOf = (lhr) =>
  Object.fromEntries(
    Object.keys(FLOORS).map((key) => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)])
  );

const meetsFloors = (scores) =>
  Object.entries(FLOORS).every(([key, floor]) => scores[key] >= floor);

if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.error(`dist/ has no index.html at ${DIST_DIR}. Run "npm run build" in the project root first.`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const server = createServer();
await new Promise((resolve) => server.listen(PORT, resolve));
const baseUrl = `http://localhost:${PORT}`;

const chrome = await launch({
  chromePath: resolveChromePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const failures = [];

async function sample(url) {
  const runnerResult = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: Object.keys(FLOORS),
    formFactor: 'mobile',
  });
  if (!runnerResult) return null;
  return { scores: scoresOf(runnerResult.lhr), report: runnerResult.report };
}

try {
  for (const route of ROUTES) {
    const url = `${baseUrl}${route}`;

    const first = await sample(url);
    if (!first) {
      failures.push(`${route}: lighthouse produced no result`);
      continue;
    }

    const runs = [first];

    /* Only a failing route is re-measured. Nothing is retried to turn a
       pass into a different pass. */
    if (!meetsFloors(first.scores) && SAMPLES > 1) {
      while (runs.length < SAMPLES) {
        const next = await sample(url);
        if (!next) {
          /* A sample that produced nothing is not a zero - scoring it as
             one would invent a failure. Stop and judge on what was
             actually measured. */
          console.log(`  a re-sample produced no result; judging on ${runs.length} sample(s)`);
          break;
        }
        runs.push(next);
      }
    }

    const taken = runs.length;
    const samplesFor = (key) => runs.map((r) => r.scores[key]);

    const verdict =
      taken > 1
        ? Object.fromEntries(Object.keys(FLOORS).map((key) => [key, median(samplesFor(key))]))
        : first.scores;

    /* Keep the report of the run that actually produced the median
       performance score, so the uploaded artifact is a real trace of the
       run being judged rather than a synthetic average of several. */
    const keep =
      taken > 1
        ? (runs.find((r) => r.scores.performance === verdict.performance) ?? runs[taken - 1])
        : first;

    const slug = route === '/' ? 'home' : route.replace(/^\//, '');
    const reportPath = path.join(OUT_DIR, `${slug}.json`);
    fs.writeFileSync(reportPath, keep.report);

    console.log(`\n${route}  (report: ${path.relative(process.cwd(), reportPath)})`);
    if (taken > 1) {
      console.log(`  first run missed a floor; re-sampled ${taken}x, verdict is the median`);
    }
    for (const [key, floor] of Object.entries(FLOORS)) {
      const score = verdict[key];
      const pass = score >= floor;
      /* Print every sample for a re-measured category. A reader deciding
         whether a failure is real needs the spread, not just the verdict:
         `84, 100, 99` and `84, 85, 83` are very different stories and the
         median alone tells neither. */
      const spread = taken > 1 ? `  [${samplesFor(key).join(', ')}]` : '';
      console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${key}: ${score} (floor ${floor})${spread}`);
      if (!pass) failures.push(`${route} ${key}: ${score} < ${floor}`);
    }
  }
} finally {
  await chrome.kill();
  server.close();
}

if (failures.length > 0) {
  console.error(`\nlighthouse: floors not met:\n${failures.map((f) => '  - ' + f).join('\n')}`);
  process.exit(1);
}

console.log('\nlighthouse: all floors met.');
process.exit(0);
