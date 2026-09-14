import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from './routes';

/** Attaches error/failure collectors before navigation so nothing that
 *  happens during the initial load is missed. */
function attachDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) => {
    // A request aborted by the page itself on navigation away is not a bug.
    if (req.failure()?.errorText === 'net::ERR_ABORTED') return;
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });

  return { consoleErrors, pageErrors, failedRequests, badResponses };
}

async function watchForCspViolations(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __cspViolations: string[] }).__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      (window as unknown as { __cspViolations: string[] }).__cspViolations.push(
        `${event.violatedDirective}: ${event.blockedURI}`
      );
    });
  });
}

for (const route of ROUTES) {
  test.describe(`route ${route.path}`, () => {
    test(`${route.name}: loads, is structurally sound, and raises no errors`, async ({ page }) => {
      const diag = attachDiagnostics(page);
      await watchForCspViolations(page);

      const response = await page.goto(route.path);
      expect(response, `no response for ${route.path}`).not.toBeNull();
      expect(response!.status()).toBe(route.status);

      // <title> non-empty.
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);

      // Exactly one <h1>.
      await expect(page.locator('h1')).toHaveCount(1);

      // html.js: confirms client JS actually ran (Base.astro's inline script).
      await expect(page.locator('html')).toHaveClass(/\bjs\b/);

      // No horizontal overflow.
      const fitsViewport = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      );
      expect(fitsViewport, 'document.documentElement.scrollWidth exceeds innerWidth').toBe(true);

      // Skip link is the first focusable element and moves focus to <main>.
      await page.keyboard.press('Tab');
      const firstFocusIsSkipLink = await page.evaluate(
        () => document.activeElement?.classList.contains('skip-link') ?? false
      );
      expect(firstFocusIsSkipLink, 'first Tab stop is not the skip link').toBe(true);

      await page.keyboard.press('Enter');
      await expect
        .poll(() => page.evaluate(() => document.activeElement?.id))
        .toBe('main');

      // Diagnostics collected during load and the above interaction.
      const cspViolations = await page.evaluate(
        () => (window as unknown as { __cspViolations: string[] }).__cspViolations ?? []
      );
      expect(cspViolations, `CSP violations:\n${cspViolations.join('\n')}`).toEqual([]);

      // Chrome logs its own "Failed to load resource: ... 404" console error
      // for the top-level navigation itself whenever the document response
      // is a 404 - which, on this one route, it is supposed to be. Every
      // other console error still fails the test.
      const unexpectedConsoleErrors = diag.consoleErrors.filter(
        (msg) =>
          !(route.status === 404 && /responded with a status of 404/.test(msg))
      );
      expect(
        unexpectedConsoleErrors,
        `console errors:\n${unexpectedConsoleErrors.join('\n')}`
      ).toEqual([]);
      expect(diag.pageErrors, `page errors:\n${diag.pageErrors.join('\n')}`).toEqual([]);
      expect(
        diag.failedRequests,
        `failed requests:\n${diag.failedRequests.join('\n')}`
      ).toEqual([]);

      // The 404 route's own document is *supposed* to answer 404; every
      // other bad response (a broken asset link, a missing font, etc.) is not.
      const unexpectedBadResponses = diag.badResponses.filter((entry) => {
        const isOwnDocument404 = route.status === 404 && entry.startsWith('404 ');
        return !isOwnDocument404;
      });
      expect(
        unexpectedBadResponses,
        `unexpected 4xx/5xx responses:\n${unexpectedBadResponses.join('\n')}`
      ).toEqual([]);
    });
  });
}

test('page titles are non-empty and unique across all five routes', async ({ page }) => {
  const titles = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route.path);
    const title = (await page.title()).trim();
    expect(title.length, `${route.path} has an empty <title>`).toBeGreaterThan(0);
    titles.add(title);
  }
  expect(titles.size, 'two or more routes share the same <title>').toBe(ROUTES.length);
});
