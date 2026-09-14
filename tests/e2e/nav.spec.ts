import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readData } from './data';

interface NavLink {
  href: string;
  label: string;
}
interface NavData {
  primary: NavLink[];
  cta: { intent: string };
  ctaOverrides: { path: string; intent: string }[];
}
interface SiteData {
  socials: { discord: string };
}

const nav = readData<NavData>('nav.json');
const site = readData<SiteData>('site.json');
const discordInvite = site.socials.discord;

function isMobile(testInfo: TestInfo) {
  return testInfo.project.name === 'mobile';
}

/** Opens the mobile panel when running the mobile project; no-op on desktop,
 *  where the primary nav is already visible in the header. */
async function ensureMobileMenuOpen(page: Page, testInfo: TestInfo) {
  if (!isMobile(testInfo)) return;
  const toggle = page.locator('.menu-toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(page.locator('#mobile-menu')).not.toBeHidden();
}

/** The nav links currently visible for this project: `.nav-links` on
 *  desktop, `.mobile-links` once the panel is open on mobile. */
function visibleNavLinks(page: Page, testInfo: TestInfo) {
  return isMobile(testInfo) ? page.locator('.mobile-links a') : page.locator('.nav-links a.nav-link');
}

test.describe('primary navigation', () => {
  test('each primary link navigates to its declared destination', async ({ page }, testInfo) => {
    for (const link of nav.primary) {
      await page.goto('/');
      await ensureMobileMenuOpen(page, testInfo);

      const links = visibleNavLinks(page, testInfo);
      await links.filter({ hasText: link.label }).first().click();

      const url = new URL(page.url());
      const [wantPath, wantHash] = link.href.split('#');
      const normalise = (p: string) => p.replace(/\/+$/, '') || '/';
      if (wantHash) {
        expect(url.hash).toBe(`#${wantHash}`);
      } else {
        expect(normalise(url.pathname)).toBe(normalise(wantPath));
      }
    }
  });

  test('aria-current="page" marks the route the reader is on', async ({ page }, testInfo) => {
    const pages = nav.primary.filter((link) => !link.href.includes('#'));
    for (const target of pages) {
      await page.goto(target.href);
      await ensureMobileMenuOpen(page, testInfo);

      const links = visibleNavLinks(page, testInfo);
      const count = await links.count();
      for (let i = 0; i < count; i += 1) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        const current = await link.getAttribute('aria-current');
        if (href === target.href) {
          expect(current, `${href} on ${target.href} should be aria-current="page"`).toBe('page');
        } else {
          expect(current, `${href} on ${target.href} should not be aria-current`).toBeNull();
        }
      }
    }
  });

  test('the primary CTA points at the Discord invite', async ({ page }, testInfo) => {
    // /partners overrides the CTA to a partnership mailto; every other page
    // keeps the "join" intent, which is the Discord invite.
    const joinPages = nav.primary
      .filter((link) => !link.href.includes('#'))
      .map((link) => link.href)
      .concat('/')
      .filter((path) => !nav.ctaOverrides.some((o) => o.path === path));

    for (const path of joinPages) {
      await page.goto(path);
      const cta = isMobile(testInfo)
        ? page.locator('.nav-cta-compact')
        : page.locator('.nav-cta').first();
      await expect(cta).toHaveAttribute('href', discordInvite);
    }
  });
});

test.describe('mobile menu', () => {
  test('the toggle opens the panel and Escape closes it, returning focus', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'the hamburger only exists below the 820px breakpoint');

    await page.goto('/');
    const toggle = page.locator('.menu-toggle');
    const menu = page.locator('#mobile-menu');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).not.toBeHidden();

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('body scroll is locked while the panel is open', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'the panel only exists below the 820px breakpoint');

    await page.goto('/');
    await page.locator('.menu-toggle').click();

    const lockedWhileOpen = await page.evaluate(() => ({
      htmlHasMenuOpen: document.documentElement.classList.contains('menu-open'),
      bodyPosition: document.body.style.position,
    }));
    expect(lockedWhileOpen.htmlHasMenuOpen).toBe(true);
    expect(lockedWhileOpen.bodyPosition).toBe('fixed');

    await page.locator('.menu-toggle').click();
    const unlockedAfterClose = await page.evaluate(() => ({
      htmlHasMenuOpen: document.documentElement.classList.contains('menu-open'),
      bodyPosition: document.body.style.position,
    }));
    expect(unlockedAfterClose.htmlHasMenuOpen).toBe(false);
    expect(unlockedAfterClose.bodyPosition).toBe('');
  });
});
