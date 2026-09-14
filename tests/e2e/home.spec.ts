import { test, expect } from '@playwright/test';
import { readData } from './data';

interface RaceResultRow {
  _placeholder?: boolean;
}

test.describe('home page', () => {
  test('the next-race strip shows an event name and date, or its empty copy', async ({ page }) => {
    await page.goto('/');

    const data = page.locator('.next-race-data');
    const empty = page.locator('.race-empty');
    const hasData = (await data.count()) > 0;
    const hasEmpty = (await empty.count()) > 0;

    // Exactly one of the two branches renders - never both, never neither.
    expect(hasData !== hasEmpty, 'expected exactly one of the data/empty next-race branches').toBe(true);

    if (hasData) {
      await expect(data.locator('.race-cell-event dd')).not.toBeEmpty();
      const whenText = await data.locator('.race-cell-when .data').first().innerText();
      expect(whenText.trim().length).toBeGreaterThan(0);
    } else {
      await expect(empty).toContainText('No race scheduled.');
    }
  });

  test('the results table has rows exactly when results.json is non-empty', async ({ page }) => {
    const results = readData<RaceResultRow[]>('results.json');
    await page.goto('/');

    // The results module is the "Scoreboard" section on the home page.
    const rows = page.locator('#scoreboard .results tbody tr');
    if (results.length > 0) {
      expect(await rows.count()).toBeGreaterThanOrEqual(1);
      await expect(rows.first()).toBeVisible();
    } else {
      expect(await rows.count()).toBe(0);
      await expect(page.locator('#scoreboard')).toContainText('No finishes published yet.');
    }
  });

  test('the garage arrows move the track by changing its scrollLeft', async ({ page }) => {
    await page.goto('/');
    const track = page.locator('[data-garage-track]');
    const next = page.locator('[data-garage-next]');
    await expect(track).toBeVisible();

    // The row is hidden by the site's own script until the track actually
    // overflows (see initGarage in src/scripts/site.ts). With five cars in
    // the current data this always overflows, but skip cleanly rather than
    // fail if a future data set ever fits without scrolling.
    const enabled = await next.isEnabled().catch(() => false);
    test.skip(!enabled, 'garage track does not overflow at this viewport with the current car list');

    const before = await track.evaluate((el) => el.scrollLeft);
    await next.click();
    await expect
      .poll(() => track.evaluate((el) => el.scrollLeft), { message: 'scrollLeft did not increase' })
      .toBeGreaterThan(before);
  });

  test('the /#scoreboard anchor lands with the scoreboard heading fully below the fixed header', async ({
    page,
  }) => {
    await page.goto('/#scoreboard');

    await expect
      .poll(async () => {
        const rects = await page.evaluate(() => {
          const header = document.querySelector('.site-nav');
          const heading = document.getElementById('scoreboard-heading');
          return {
            headerBottom: header?.getBoundingClientRect().bottom ?? 0,
            headingTop: heading?.getBoundingClientRect().top ?? 0,
          };
        });
        return rects.headingTop - rects.headerBottom;
      }, { message: 'results-heading top is above the fixed header bottom' })
      .toBeGreaterThanOrEqual(-0.5); // sub-pixel rounding fudge
  });
});
