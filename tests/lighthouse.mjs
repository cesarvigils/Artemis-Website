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

try {
  for (const route of ROUTES) {
    const url = `${baseUrl}${route}`;
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: Object.keys(FLOORS),
      formFactor: 'mobile',
    });

    if (!runnerResult) {
      failures.push(`${route}: lighthouse produced no result`);
      continue;
    }

    const slug = route === '/' ? 'home' : route.replace(/^\//, '');
    const reportPath = path.join(OUT_DIR, `${slug}.json`);
    fs.writeFileSync(reportPath, runnerResult.report);

    console.log(`\n${route}  (report: ${path.relative(process.cwd(), reportPath)})`);
    for (const [key, floor] of Object.entries(FLOORS)) {
      const score = Math.round((runnerResult.lhr.categories[key]?.score ?? 0) * 100);
      const pass = score >= floor;
      console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${key}: ${score} (floor ${floor})`);
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
