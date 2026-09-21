import { test, expect } from '@playwright/test';
import { ALL_PAGES } from './routes';

/**
 * `DESIGN.md` section 1, enforced.
 *
 * Two rules there had been prose that nothing checked, and both were
 * broken. "Equal card grids" is listed as deliberately absent, and **no
 * layout family twice on a page** is the rule the redesign is built on.
 * The home page carried four equal three-column blocks, three of them at
 * identical widths, which is the single thing that made the site read as
 * templated. A rule nothing measures is a rule that drifts.
 *
 * WHAT COUNTS AS A FAMILY
 *   The column count of a rendered equal-width grid. Two 3-ups on one page
 *   are the same family however differently they are styled: at a glance
 *   they are the same shape repeating, which is the thing being forbidden.
 *   Unequal grids are exempt - they read as composition rather than as a
 *   row of cards - which is why `/partners` may hold a 3-up and a 2-up.
 *
 * WHY `<main>` ONLY
 *   The nav and footer are site chrome, present identically on every page,
 *   and a footer's columns read as columns rather than as cards. Counting
 *   them flags a false positive on any page whose content happens to share
 *   the footer's column count, which is exactly what happened the first
 *   time this was measured by hand.
 *
 * WHY COMPUTED STYLE AND NOT THE SOURCE
 *   `grid-template-columns` in a stylesheet does not tell you what rendered:
 *   a media query, a `minmax`, or an `auto-fit` can all change the count. The
 *   browser is the only honest source, and screenshots cannot see it.
 */

/** Equal-width grids inside `<main>`, as the browser actually laid them out. */
async function equalGridFamilies(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const found: { family: string; label: string }[] = [];
    for (const el of Array.from(document.querySelectorAll('main *'))) {
      const style = getComputedStyle(el);
      if (style.display !== 'grid') continue;

      const widths = style.gridTemplateColumns
        .split(' ')
        .filter(Boolean)
        .map((value) => Math.round(parseFloat(value)));

      /* One column is a stack, not a grid family. */
      if (widths.length < 2 || widths.some((w) => Number.isNaN(w))) continue;

      /* 2px of tolerance: sub-pixel rounding, not a design decision. */
      const equal = widths.every((w) => Math.abs(w - widths[0]) < 2);
      if (!equal) continue;

      found.push({
        family: `${widths.length}-up`,
        label: (el.className || el.tagName).toString().split(' ')[0],
      });
    }
    return found;
  });
}

/**
 * Equal card grids are on `DESIGN.md` section 1's deliberately-absent list
 * outright, not merely banned from repeating - and the repeat check above
 * cannot see that, which is how `/partners` kept a three-up "what a partner
 * gets" row of title-plus-a-line cards long after the home page's were gone:
 * it was the only one on its page, so nothing failed.
 *
 * Two three-ups are allowed by name, and both are named rather than pattern-
 * matched so that adding a third is a decision someone has to write down:
 *
 *   `.join-steps`   DESIGN.md carves this out: it is genuinely a sequence,
 *                   and it is the one place numbers may label one.
 *   `.entry-strip`  Car numbers and names, ruled like a grid sheet. It is a
 *                   data table that happens to use `display: grid`, not a
 *                   row of cards: the cells are 186px and hold a number and
 *                   a name, with no heading and no prose.
 */
const CARD_GRID_EXEMPT = ['join-steps', 'entry-strip'];

for (const route of ALL_PAGES) {
  test(`${route.name}: holds no equal card grid`, async ({ page }) => {
    await page.goto(route.path);

    const offenders = (await equalGridFamilies(page)).filter(
      (g) => Number(g.family.split('-')[0]) >= 3 && !CARD_GRID_EXEMPT.includes(g.label)
    );

    expect(
      offenders,
      offenders.length
        ? `${route.path} renders an equal card grid, which DESIGN.md section 1 ` +
          `lists as deliberately absent:\n` +
          offenders.map((g) => `  ${g.family} .${g.label}`).join('\n') +
          `\nIf it is data rather than cards, add it to CARD_GRID_EXEMPT with a reason.`
        : ''
    ).toEqual([]);
  });

  test(`${route.name}: no layout family repeats on the page`, async ({ page }) => {
    await page.goto(route.path);

    const grids = await equalGridFamilies(page);

    const byFamily = new Map<string, string[]>();
    for (const { family, label } of grids) {
      byFamily.set(family, [...(byFamily.get(family) ?? []), label]);
    }

    const repeated = [...byFamily.entries()].filter(([, labels]) => labels.length > 1);

    expect(
      repeated,
      repeated.length
        ? `${route.path} repeats a layout family, which DESIGN.md section 1 forbids:\n` +
          repeated.map(([family, labels]) => `  ${family}: .${labels.join(' + .')}`).join('\n')
        : ''
    ).toEqual([]);
  });
}
