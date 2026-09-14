# The 2026 redesign, in one document

What changed, what it measures, what is still yours to decide, and what to do
on the day you switch it on.

The work happened on the `redesign` branch over five passes. Each pass was
reviewed against the one before it, and each pass has a full report in this
folder (`pass1-report.md` through `pass5-report.md`) if you want the detail.
This file is the summary.

The short version: the site went from an animation showcase with placeholder
copy to a page that publishes evidence. The identity did not change. The teal,
the near-black, the leaf-and-profile mark, the two-weight ARTEMIS / ESPORTS
lockup and the "on the hunt" voice are all the same. What changed is what the
page spends its space on.

---

## Pass 1: the direction and the rebuild

The old site was four pages of slogans over a scroll-jacked animation. It
pinned sections, hijacked the scroll wheel, shipped 133 KB of JavaScript to do
it, and copied every full-size original photograph into the build, so a visitor
could download a 7.5 MB JPEG. It said what the team believed and never said what
the team had done.

Pass 1 committed to one direction, "pit wall, not billboard", and rebuilt every
page around it: tabular numerals, hairline rules, position markers, dense but
calm data rows. Results and the next race became home-page modules rather than
links. The scroll hijacking, the pinned panels, the marquee and the magnetic
buttons all went, and GSAP and Lenis went with them. `PRODUCT.md` and
`DESIGN.md` were written to record why. Client JavaScript went from 133 KB to
about 3 KB, and the build from 72 MB to 2.24 MB.

## Pass 2: the data contract and the evidence

Three critiques covering user experience, visual design and motion produced 70
findings. Two of them were bugs a visitor would have hit: the results table was
invisible on a phone, and the header went transparent over the page after the
hero.

The larger change was structural. `results.json`, `drivers.json` and
`events.json` were rewritten to `docs/data-contract.md`, the specification the
Discord bot implements, and `npm run check:data` was added as a build gate so a
bad write from Discord fails the build instead of publishing a broken page.
Positions began printing their field size (`P2 / of 41`), because a position
without one is an assertion rather than evidence, and every roster row began
showing that driver's most recent finish. The hero render was swapped to the
Interlagos LMP2, the only one with no third-party logo in frame.

## Pass 3: typography, layout and the in-between sizes

Two more critiques, 50 findings, all fixed. This pass was about the sizes
nobody designs at: 768, 1024, 1280, and a phone at 200% text.

Tokens replaced improvisation. Four leading values, six tracking values, one
measure for every lead paragraph, and a spacing ramp keyed to width rather than
window height (which had been making a 1024x768 laptop the tightest layout on
the site). Touch targets went from 391 undersized controls to zero. Images went
from 55 over-fetched derivatives to zero. Every page now holds a 390px layout at
a doubled root font, where five of five used to force the browser's shrink-to-
fit. Every array the bot writes got a deliberate empty state, verified by
emptying each file and building.

## Pass 4: motion, deployment and the signature moment

Two critiques, 41 findings. The entrance was animating the hero copy from
`opacity: 0`, which meant the first frame of the home page was a photograph and
nothing else, and it was costing real load time on the inner pages. It is a
16px rise now and nothing fades in from nothing.

Five duration tokens and three easing curves became three and two, so one
gesture stopped having four answers. Every interactive element got hover, press
and focus, with the keyboard getting the same affordance the mouse does. The
site also got one signature moment: the hero's position marker counts down from
the field size to the finish, the way a timing tower resolves a result, and the
podium rule draws underneath it. It animates the evidence, not the logo, and it
happens once. `vercel.json` was added: security headers, a content security
policy, cache rules and the redirects for the old site's URLs.

## Pass 5: fonts, polish and handover

The four web fonts were subset to the characters the site can render: 78.6 KB to
48.0 KB, about 30 KB off a first view, with ten full-page renders coming back
pixel-identical to the previous build. Most of the saving is JetBrains Mono's
code-editor ligature tables, which a results sheet has no use for.

The rest was polish. The results sheet's column headers were quietly being
styled by the body-cell rules, so two of the five headers were the wrong size
and colour. Eight rules were asking for a font weight the site does not ship.
The four-across values band had its four sentences starting at three different
heights. The countdown said "Under way" at six in the morning on race day, which
the clock could not support. Eleven hard-coded colours became tokens. Then
`README.md`, `CONTENT.md` and this file were written for whoever picks the site
up next.

---

## What it measures

Everything below is measured against the built site served the way `vercel.json`
serves it: brotli compression, the real headers. Three consecutive runs gave the
same numbers.

### Lighthouse 13.4.1

| Route | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| `/` mobile | **100** | 100 | 100 | 100 | 0.8 s | 1.8 s | 0 | 0 ms |
| `/team` mobile | **100** | 100 | 100 | 100 | 0.6 s | 1.2 s | 0 | 0 ms |
| `/about` mobile | **100** | 100 | 100 | 100 | 0.6 s | 1.1 s | 0 | 0 ms |
| `/partners` mobile | **100** | 100 | 100 | 100 | 0.9 s | 1.4 s | 0 | 0 ms |
| `/` desktop | **100** | 100 | 100 | 100 | 0.2 s | 0.4 s | 0 | 0 ms |

For reference, the same build on a test server with no compression scores 99 on
`/` and 100 on the other four. Vercel compresses, so the table above is the
number that matters.

### Accessibility

- **Zero WCAG 2.0 / 2.1 / 2.2 level A and AA violations**, on all five pages at
  1440 and at 390, plus the mobile menu with the panel open. Checked with
  axe-core 4.13.
- The only rule that fires is the AAA 7:1 contrast bar, which is included on
  purpose and which the body text clears at AA (4.5:1) everywhere.
- 143 keyboard stops across the five pages, every one with a visible focus ring
  and a non-empty name. The skip link is the first stop on every page.
- The site holds a 390px layout at a 200% root font on all five pages, works in
  Windows High Contrast, respects "reduce motion" and "increase contrast", and
  prints on white paper as black ink.

### Size

| | Before the redesign | Now |
|---|---|---|
| Whole build | 72 MB | **2.59 MB**, 78 files |
| Client JavaScript | 133 KB, external | **6.6 KB inlined**, no external file |
| CSS | 3 render-blocking files | **inlined**, about 8.8 KB compressed per page |
| Web fonts | 78.6 KB | **48.0 KB** |
| Home page document | - | 108.7 KB raw, **17.9 KB** over brotli |
| Hero image at 1440 on a retina screen | 403.9 KB | **113.4 KB** |

Nothing on the site loads from another server. No analytics, no cookies, no
third-party scripts, no external fonts.

### Responsive

Fourteen viewport modes against five pages, scored on the original reviewer's
own bar: **15 of 70 cells carry a note**, all of them explained and accepted.
Ten are photographs that cannot be sharper than their source file (the spray
texture and the cropped Nordschleife render), five are one menu link sitting
below the fold at 200% text, and one is the home page's second button at the
same text size. Nothing over-fetches: zero images more than 1.6 times the pixels
they need.

---

## What is still yours to decide

None of these block go-live. All of them make the site better.

1. **The real roster and the real results.** Every driver, every result and every
   calendar entry on the site is realistic placeholder data. Seventeen records
   in total. Run `/data placeholders` in Discord to list them, then replace them
   with `/driver`, `/result` and `/event`. `CONTENT.md` has the full list with
   ids.
2. **Whether iRating and licence class get published.** The slot is built and
   renders the moment it is filled in, and nothing is invented to fill it. This
   is public information about individual people, so it is a team decision
   rather than a missing task.
3. **Whether NordVPN is a current partner.** The best-lit render we have is out
   of the site because it carries a legible NordVPN door decal while the
   Partners page says GLYTCH is the only partner. A yes puts the render back and
   adds the record; a no keeps it out.
4. **The About origin copy.** The two paragraphs under "Where this came from" are
   a draft written from the only two facts we had: founded 2017, first full
   iRacing season 2023. Read them and rewrite them in your own words.
5. **A dark version of the GLYTCH logo.** The file we have is white on
   transparent, so it disappears on any light ground, including Windows High
   Contrast. The site puts it on a dark plate as a workaround. Ask GLYTCH for a
   dark-on-transparent export.
6. **`GITHUB_BRANCH` in the bot's configuration.** It is `maintenance` today,
   which is production. It does not need to change at go-live, but confirm it is
   right before you merge, because it decides which branch a Discord command
   writes to.
7. **Vercel: set the production branch and confirm the policy.** The project has
   to be pointed at `maintenance`. Confirm the content security policy is live
   after the first deploy (`DEPLOY.md` section 4 says how), and set
   `X-Robots-Tag: noindex` for the Preview environment under Settings,
   Deployment Protection, so preview builds do not get indexed. A static config
   file cannot do that part.
8. **One photograph of a sim rig.** Every picture on the site is from the gaming
   side of the org, captioned honestly as such. One photo of a wheel, a rig or a
   screen with a car on it would do more for the About page than any edit.

---

## Go-live checklist

Work down it in order. Nothing here is urgent; the current site keeps serving
until step 2.

1. **Read the site once more on the `redesign` branch.** `npm install`, then
   `npm run dev`, and walk all five pages plus a bad URL on a phone and a
   laptop.
2. **Merge `redesign` into `maintenance`.**
   ```bash
   git checkout maintenance
   git pull
   git merge redesign
   git push
   ```
   Vercel builds on the push. If the build fails it publishes nothing and the
   old site stays live, so this step is safe to attempt.
3. **Check the Vercel project is deploying `maintenance` as production**, not
   `master`. Settings, Git, Production Branch.
4. **Confirm the bot's `GITHUB_BRANCH` is `maintenance`** and restart the bot if
   you change it.
5. **Remove the placeholder data.** In Discord: `/data placeholders` to list
   them, then `/result remove`, `/driver remove` and `/event remove` for each id,
   adding the real records as you go. Do results and drivers together, because a
   result's driver names are matched against the roster. Finish with
   `/data validate`.
6. **Verify the live site.** In a private window, hard refresh, and check:
   - all five pages load and the 404 page appears for a bad URL;
   - "Join the team" opens the Discord invite, and the button on `/partners`
     opens a mail client instead;
   - the "Next race" strip shows a real future race and its countdown is
     running;
   - one old URL still works: `artemisesports.com/results` should send you to
     the results table;
   - `artemisesports.com/team/` with a slash redirects to `/team` without one;
   - the browser console on the home page is empty after opening the menu and
     pressing the garage arrows.
7. **Share a link in Discord or on X** and confirm the preview card shows the
   Artemis lockup.
8. **Submit the sitemap.** Google Search Console, add
   `https://artemisesports.com` as a property if it is not there, verify it
   (the DNS record is the easiest route), then Sitemaps, and submit
   `sitemap.xml`. Do the same in Bing Webmaster Tools if you want Bing. This is
   the only step that needs doing once and then never again.
9. **Run one real `/result` in Discord** against a test entry, watch it appear on
   the home page about a minute later, then remove it. That proves the whole
   chain works end to end.

If anything in step 6 is wrong, `DEPLOY.md` section 4 lists what each symptom
means and which file to fix.
