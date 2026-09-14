# Testing

The test suite lives in `tests/`, a separate npm project (`artemis-site-tests`)
from the site itself, and tests the built `dist/` output - not the dev
server, not source files. It never modifies anything under `SCOPE` of the
site at runtime except `src/data/*.json`, and only briefly, during the
empty-data check, which always restores them.

## Running everything locally

```sh
# 1. Build the site once. Every check below runs against dist/, not astro dev.
npm run build

# 2. Install the test project's own dependencies and Playwright's browser.
cd tests
npm ci
npx playwright install chromium

# 3. The end-to-end suite: pages, nav, home-page behaviour, accessibility.
#    Serves ../dist itself (tests/server.mjs) with vercel.json's headers
#    applied, so CSP is enforced the same way the real host enforces it.
npm test

# 4. Lighthouse floors (performance >= 95, accessibility/best-practices/seo = 100).
npm run test:lh

# 5. The empty-data-set build guard. Safe to run any time: it backs up
#    src/data/*.json, empties them, rebuilds, restores, and rebuilds again
#    with the real data - even if it fails partway through.
npm run test:empty
```

Steps 3-5 can run in any order once step 1-2 are done. `npm test` opens no
browser window (headless); to watch it, use `npx playwright test --headed`
or `npx playwright test --ui`.

Chrome for local Lighthouse runs: if `CHROME_PATH` is unset, `test:lh` first
tries Playwright's installed Chromium, then falls back to whatever Chrome
`chrome-launcher` finds on the system (on this machine, that's
`C:\Program Files\Google\Chrome\Application\chrome.exe`). Set `CHROME_PATH`
to override.

## What each part checks

| File | Checks |
| --- | --- |
| `tests/e2e/pages.spec.ts` | Every route (`/`, `/team`, `/about`, `/partners`, and a 404) loads with the right status, has a non-empty and unique `<title>`, exactly one `<h1>`, no console/page/CSP errors, no failed or 4xx/5xx requests, no horizontal overflow, `html.js` present, and the skip link is the first focusable element and moves focus to `<main>`. |
| `tests/e2e/nav.spec.ts` | Header nav links go where their `label`/`href` in `src/data/nav.json` says; `aria-current="page"` marks the right link on the right page; the mobile hamburger opens the panel, Escape closes it and returns focus, body scroll is locked while it's open; the primary CTA points at the Discord invite (except `/partners`, where it's a "partner with us" mailto by design). |
| `tests/e2e/home.spec.ts` | The next-race strip shows a real event name and date, or its "No race scheduled." copy - whichever `src/data/events.json` currently implies; the results table has rows exactly when `src/data/results.json` is non-empty; the garage arrows move `scrollLeft`; navigating to `/#results` lands with the heading fully clear of the fixed header. |
| `tests/e2e/a11y.spec.ts` | `@axe-core/playwright` against every route, WCAG 2.1 A/AA tags, zero violations. AAA-tagged findings are attached to the report as information only and never fail the run. |
| `tests/empty-data-build.mjs` (`npm run test:empty`) | Empties `results.json`, `events.json`, `drivers.json`, `partners.json`, runs `npm run build`, asserts it still exits 0 (the site's contract is that an empty data file is valid and renders an empty state - see `scripts/check-data.mjs`), restores the files, and asserts `git diff --quiet -- src/data` so nothing was left changed. Plain Node, not Playwright - runs even without the Playwright browser installed. |
| `tests/lighthouse.mjs` (`npm run test:lh`) | Lighthouse against `/` and `/team` on the mobile form factor. Performance floor is 95 (not 100 - CI runners are noisy shared VMs and a couple of points of jitter is not a real regression); accessibility, best-practices and SEO are all 100. Reports land in `tests/.lighthouse/*.json` (gitignored). |

Both viewports the suite claims to cover - desktop (1440x900) and mobile
(390x844, `isMobile: true`) - come from `playwright.config.ts`'s two
projects; every spec above (`pages`, `nav`, `home`, `a11y`) runs once per
project, so the a11y run alone is 5 routes x 2 viewports = 10 combinations.

## Reading a failure

- **Playwright (`npm test`)**: the terminal names the failing spec, project
  (`desktop`/`mobile`) and assertion. `tests/playwright-report/index.html`
  (opened automatically on failure locally, or downloaded as a CI artifact)
  has the trace, screenshot and network log for the failing test. A `nav.spec`
  or `pages.spec` failure that only reproduces on `mobile` is almost always a
  breakpoint/viewport issue, not a logic one - check the 820px breakpoint in
  `src/components/Nav.astro` first.
- **`npm run test:lh`**: prints `PASS`/`FAIL` per category per route with the
  score and the floor. A `performance` miss is usually a new unlazied image,
  render-blocking request, or a layout shift; `accessibility`/`best-practices`/
  `seo` misses at 100 are almost always a genuine regression (those floors do
  not have CI-noise headroom by design) - open the JSON report in
  `tests/.lighthouse/` for the specific audit that failed.
- **`npm run test:empty`**: if this fails on the build step, `npm run build`
  itself has a bug when handed `[]` for one of the four data files (that is
  a real site bug, not a test bug - the data contract explicitly requires an
  empty array to be valid). If it fails only on the `git diff` step, the
  restore did not put `src/data` back byte-for-byte; run `git status --
  src/data` to see what's left and restore by hand
  (`git checkout -- src/data`) before re-running anything else.
- **CI**: the `build` job gates everything else - if it fails, `e2e` and
  `lighthouse` never run (`empty-data` runs independently and does not need
  `build`'s artifact, since it builds its own copy of the data-mutated
  state). A red `e2e` job with a green `build` job means the failure is in
  the suite's assumptions about the already-built site, not in the build
  itself.

## The placeholder guard

`scripts/guard-placeholders.mjs` fails a build (exit 1) when both are true:
the build is a production build (`VERCEL_GIT_COMMIT_REF=master` or
`ARTEMIS_PRODUCTION=1`), and at least one record in
`src/data/{results,drivers,events,partners}.json` carries
`"_placeholder": true`. Every other case - previews on `preview`, local
dev, CI jobs that set neither variable - it exits 0 with a one-line summary.

It is **not** wired into `package.json` by this change (see the comment at
the top of the script for why, and the exact line to add). Run it directly
to see its two behaviours:

```sh
node scripts/guard-placeholders.mjs                 # exit 0: not a production build
ARTEMIS_PRODUCTION=1 node scripts/guard-placeholders.mjs   # exit 1: current data has placeholders
```

The guard runs as part of `prebuild` (after `check:data`), so a production build
on `master` stops with the list of placeholder ids until they are replaced through
the Discord bot.

## Unit tests (no browser)

`test/` holds `node --test` suites for the iRacing sync script (`npm run test:sync`,
fixture-driven, no credentials needed). `tests/` is the browser suite described above.
Both run in CI.
