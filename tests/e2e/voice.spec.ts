import { test, expect } from '@playwright/test';
import { ALL_PAGES } from './routes';

/**
 * `docs/brand-core.md` section 7, enforced on what actually renders.
 *
 * The voice is "a driver on the radio right after a stint: plain, specific,
 * a little dry. Lead with the fact and stop." That section has a say /
 * don't-say table, and `DESIGN.md` section 1 bans em dashes outright, and
 * until now nothing checked either.
 *
 * It was not theoretical. `/standings` shipped "an invented one would be
 * worse than none" in both its meta description and its on-page lead: a
 * sentence about the team's own restraint, which is the same move as the
 * table's "we build in silence and compete with precision". Fixing the
 * meta description by hand missed the visible copy, because a person
 * checking by hand checks the thing they were thinking about.
 *
 * WHY THE RENDERED PAGE AND NOT THE SOURCE
 *   Copy reaches the page from `site.json`, from `*.astro` literals, from
 *   the data files and from the bot. Grepping components would miss most of
 *   it. The DOM is where all the sources meet.
 *
 * These patterns are deliberately narrow. A broad "AI words" regex would
 * fire on legitimate racing language and train people to ignore it.
 */

/** Visible text, with script and style content excluded. */
async function visibleText(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (/^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const parts: string[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) parts.push(n.textContent ?? '');
    return parts.join(' ').replace(/\s+/g, ' ');
  });
}

const BANNED: { name: string; pattern: RegExp; why: string }[] = [
  {
    name: 'em dash',
    pattern: /—/g,
    why: 'DESIGN.md section 1 lists em dashes as deliberately absent.',
  },
  {
    name: 'exclamation mark',
    pattern: /!/g,
    why: 'brand-core section 7: no exclamation spam.',
  },
  {
    name: 'emoji',
    pattern: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    why: 'brand-core section 7: no emoji.',
  },
  {
    name: 'a sentence about our own restraint',
    /* "worse than none", "we build in silence", "results speak louder".
       The brand core's don't-say column names this exact move. */
    pattern: /\bworse than (none|nothing)\b|\bin silence\b|\bspeak(s)? louder\b/gi,
    why: "brand-core section 7 don't-say: never a sentence about how quiet we are.",
  },
  {
    name: 'marketing filler',
    pattern: /\b(seamless(ly)?|unlock|elevate|world-class|best-in-class|cutting-edge)\b/gi,
    why: 'brand-core section 7: plain and specific, not promotional.',
  },
];

for (const route of ALL_PAGES) {
  test(`${route.name}: copy holds the brand voice`, async ({ page }) => {
    await page.goto(route.path);
    const text = await visibleText(page);

    const broken = BANNED.flatMap(({ name, pattern, why }) => {
      const found = [...text.matchAll(pattern)];
      return found.length
        ? [
            `${name} (${found.length}x) - ${why}\n      ` +
              found
                .slice(0, 3)
                .map((m) => `…${text.slice(Math.max(0, m.index! - 40), m.index! + 40).trim()}…`)
                .join('\n      '),
          ]
        : [];
    });

    expect(broken, broken.length ? `${route.path}:\n    ${broken.join('\n    ')}` : '').toEqual([]);
  });
}
