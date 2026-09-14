import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES } from './routes';

/** The bar the site is actually held to. Run once per route per Playwright
 *  project (desktop/mobile), so ten combinations total across the suite. */
const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function formatViolations(violations: { id: string; impact?: string | null; help: string; nodes: unknown[] }[]) {
  return violations
    .map((v) => `${v.id} (${v.impact ?? 'unknown'}): ${v.help} - ${v.nodes.length} node(s)`)
    .join('\n');
}

for (const route of ROUTES) {
  test(`${route.name}: zero WCAG 2.1 AA violations`, async ({ page }, testInfo) => {
    await page.goto(route.path);

    const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
    expect(results.violations, formatViolations(results.violations)).toEqual([]);

    // AAA is informational only - recorded on the report, never failing.
    // The site has not committed to an AAA bar, but a silent regression
    // there should still be visible to a human reading the run.
    const aaaResults = await new AxeBuilder({ page }).withTags(['wcag2aaa', 'wcag21aaa']).analyze();
    await testInfo.attach(`${route.name}-aaa-informational`, {
      body: JSON.stringify(
        aaaResults.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        null,
        2
      ),
      contentType: 'application/json',
    });
    if (aaaResults.violations.length > 0) {
      console.log(
        `[informational] ${route.path}: ${aaaResults.violations.length} AAA-only violation(s) - ` +
          formatViolations(aaaResults.violations)
      );
    }
  });
}
