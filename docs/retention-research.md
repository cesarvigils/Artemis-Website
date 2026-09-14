# Retention & Engagement Research Brief — Artemis Esports Marketing Site

Scope: evidence on what keeps visitors on a small sports/esports team site, applied to a 4-page
static Astro site (Home, Team, About, Partners) for Artemis Esports, a ~5-driver iRacing
endurance/GT + NASCAR oval team with real results, tiny social following, no sponsors yet,
recruiting via Discord. Research budget used: 14 web searches, 12 page fetches (2 fetches failed —
noted where relevant).

---

## 1. What actually drives time-on-site and return visits

Each item: recommendation → evidence (with numbers where they exist) → application to Artemis.
Evidence strength tag: **Strong** (primary study/first-party data), **Moderate** (credible but
secondary, small-sample, or vendor-reported), **Practitioner consensus** (widely held but no hard
number found).

**1. Make the value proposition and identity legible in the first screen — most visitors never read past it.**
Evidence: NN/g's original eyetracking study (232 participants, thousands of pages) found users scan
in an F-shaped pattern and read on average only 20–28% of words on a page; the first two lines and
left-aligned leading words of each block get disproportionate attention. [Strong]
Applies: Home hero must say who Artemis is, what it races (iRacing endurance/GT + NASCAR oval),
and the one action to take — in the first visible block, not after scroll animation plays out.

**2. Treat page weight as a retention lever, not a design afterthought — LCP ≤2.5s, INP ≤200ms.**
Evidence: Google's Core Web Vitals thresholds are set at the 75th percentile of real page loads:
LCP "good" ≤2,500ms / "poor" >4,000ms; INP "good" ≤200ms / "poor" >500ms; CLS "good" ≤0.1. Per
CrUX-based industry tracking, only ~62% of mobile pages currently pass LCP (the hardest vital to
pass) vs ~77% passing INP. [Strong for thresholds (web.dev); Moderate for pass-rate figures
(secondary CrUX aggregation, not fetched from CrUX directly)]
Applies: heavy scroll animation, video hero, and dark-teal gradient/texture assets are exactly the
things that blow LCP budgets — every hero asset needs explicit dimensions, compression, and a fast
first paint before any animation library initializes.

**3. Slow loads convert directly to abandonment, especially on mobile.**
Evidence: Google/SOASTA's mobile analysis (93 page-speed metrics across large e-commerce sample)
found bounce probability rises 32% as load time goes 1→3s, 90% at 1→5s, and 123% at 1→10s; roughly
half of mobile visits are reported abandoned past the ~3s mark, and pages that load 1s faster saw
up to 27% higher conversion. [Strong — Google first-party research, but this session's PDF fetch of
the original report failed; numbers are as reported on Think with Google marketing pages, not
independently re-verified against the source PDF.]
Applies: same implication as #2 — this is the economic reason page-speed discipline outranks visual
polish for a team still trying to get its first sponsor look.

**4. Do not scroll-jack; if you use scroll-triggered animation, keep it brief, below-the-fold, and skippable.**
Evidence: NN/g's dedicated 2024 usability study on scrolljacking (scroll speed/direction altered by
script) found the majority of participants were at least mildly disoriented, some believed it was a
bug, and goal-oriented (task-focused) users had markedly less tolerance than exploratory users —
one described it as making them "severely agitated" enough to leave. Mobile made it worse: smaller
screens made jacked sections feel longer, and collapsed mobile nav removed users' usual escape
route. NN/g's own conditional guidance: acceptable only when it progressively discloses relevant
content, stays brief, avoids combining with heavy text, and the functional value clearly outweighs
the cost. [Strong — dedicated usability study]
Applies: Artemis's "heavy scroll animation" home page is a direct match for the failure mode NN/g
documents. Recommendation: replace any pinned/hijacked scroll sections with ordinary scroll-reveal
(fade/slide-in triggered by native scroll position, never overriding scroll speed or direction),
and respect `prefers-reduced-motion`. [Motion-accessibility fallback itself is Practitioner
consensus in this brief — the general WCAG expectation to let users disable non-essential motion
was not independently re-verified against the W3C spec this session.]

**5. Design mobile-first, but don't assume esports-general mobile stats transfer 1:1 to a wheel-and-pedals sim-racing audience.**
Evidence: secondary market aggregators report mobile devices account for roughly 56% of esports
*viewership* generally, and mobile carries the majority of the overall gaming *player base* by
count. [Moderate — aggregator-reported figures (sqmagazine.co.uk), not a primary Newzoo/Deloitte
report fetched directly; no reliable number found for sim-racing-specific site traffic split.]
Applies: iRacing itself cannot be played on a phone, so Artemis's own visit mix is plausibly more
desktop-weighted than "gaming" averages suggest — but checking results, the Discord invite, and
sponsor decks from a phone is still common. Build mobile-first for layout and tap targets, but don't
over-invest in mobile-only interaction patterns at the expense of desktop hero/scroll performance.

**6. Give the page one dominant call-to-action, not several competing ones.**
Evidence: marketing-analytics vendors (Databox, WordStream, HubSpot, others) commonly report large
lifts from cutting a page to a single CTA — figures cited include "up to 266%" conversion
improvement and "371% more clicks" in specific case studies. [Moderate/weak — these are vendor
blog statistics from isolated case studies, not controlled academic research; treat the *direction*
(fewer CTAs outperform many) as more reliable than the specific percentages, which are Practitioner
consensus-level generalizable, not the raw numbers.]
Applies: Home and Team pages should each have exactly one primary CTA — "Join our Discord" — with
at most one visually secondary action (e.g., "See results"); Partners page should swap the primary
CTA to a partnership contact/media-kit action instead of Discord.

**7. Fresh race results and a visible "next event" clock give people a reason to come back.**
Evidence: multiple SEO/content-marketing sources assert that recently updated pages see meaningfully
longer dwell time (one figure cited: "31% longer" than stale pages) and that visitors are more
likely to return to sites that are visibly kept current. [Weak/Practitioner consensus — no primary,
methodologically described study was located in this session; the 31% figure traces to marketing
blogs (e.g., webselect.agency) without a disclosed original source, so treat it as directional only,
not a reliable number.]
Applies: a "Next Race" countdown module and a rolling "Last 3 Results" strip on the Home page are
low-cost, high-plausibility return-visit drivers even without a hard verified stat — they also
double as content that's cheap to update from Discord/iRacing results without a CMS.

**8. Real results are Artemis's strongest social-proof asset — use them in place of follower counts.**
Evidence: no direct academic study of small-team social proof was located this session; this is
grounded in observed convention across the reference sites analyzed in Section 2 — the two most
resourced examples (Mercedes-AMG Petronas Esports, Coanda Esports) both foreground standings/news
recaps as their core credibility content, while the two homepage-CTA-led examples with no results
module (Apex Racing Team, Team Redline) rely instead on roster and history. [Moderate — observational
pattern across real competitor sites, not a controlled study.]
Applies: because Artemis has "real race results but tiny social following," results/standings are
the more credible trust signal available and should be surfaced directly on-page, not linked out.

**9. Sponsors doing a 60-second check need a self-contained trust package: results, roster, reach, and a way to contact you.**
Evidence: Baymard Institute's e-commerce trust research (checkout context, not sponsorship, so
treat as analogous rather than direct) finds distrust drives roughly 19% of checkout abandonment,
and Baymard's 2025 benchmark rated 67% of mobile e-commerce homepages "mediocre" or "poor" on
homepage/navigation UX. [Moderate — the underlying discipline (trust signals reduce abandonment) is
Baymard's own strong research tradition, but these specific figures are e-commerce checkout
statistics being applied by analogy to a sponsorship-decision context, and were captured via
secondary summaries rather than a direct Baymard report fetch on this exact topic.]
Applies: Partners page should read as a one-screen dossier: recent results, roster snapshot, honest
audience numbers, and a direct contact/media-kit CTA — matching what every well-resourced reference
site bundles into its partner-facing content.

**10. On a dark theme, protect contrast and line length or the "read" half of scanning breaks down.**
Evidence: Baymard's line-length research recommends 50–75 characters per line (66 cpl as a common
target), citing WCAG 1.4.8's ≤80-character guidance, 1.5em line-height, and defined
word/letter-spacing; Baymard's usability testing found users "immediately go back" from pages with
overlong text blocks. [Strong — Baymard research with cited WCAG backing.]
Applies: Artemis's dark-teal theme needs body copy capped near 70ch max-width and text/background
contrast checked (light text on dark teal is easy to under-contrast); this was not independently
re-verified against WCAG's numeric contrast ratios this session, so treat the specific 4.5:1 AA
figure, if used, as Practitioner consensus rather than a verified-this-session number.

**11. Video/motion content can lift engagement, but only if it doesn't cost you the LCP budget from #2.**
Evidence: vendor case studies (Firework, Scopic, EyeView-cited figures) report video lifting landing
page conversion "up to 86%" and doubling click-through vs static images; one meta-analysis-style
vendor summary notes video wins on engagement/awareness while static images can win on direct-
response efficiency, i.e., it's context-dependent, not a universal win. [Weak/Moderate — all sourced
to marketing/video-vendor blogs with selectively reported case studies; no independent academic
verification found.]
Applies: short, muted, compressed onboard/race clips used as background loops can work, but only
with a static poster-frame for first paint, lazy-loaded after LCP, given how directly this trades
against the speed evidence in #2–#3, which is much better sourced.

**12. Keep navigation flat — a handful of pages/sections beats deep hierarchy for a site this size.**
Evidence: no primary study with a specific page-count threshold was located this session ("no
reliable number found" for an optimal page count). This is standard information-architecture
practice and is also what the reference sites in Section 2 do in practice — every one analyzed uses
a single-level nav (5–9 top-level items, no deep sub-menus) even where they cover far more content
than Artemis has. [Practitioner consensus + observational pattern from Section 2.]
Applies: supports keeping Artemis at 4 pages and adding "next race" / "results" as Home-page
modules rather than new top-level pages — see Section 3.

---

## 2. Reference sites

Fetched and analyzed 5 of the 6–7 candidates attempted. **Veloce Esports (veloce.gg)** and
**R8G Esports** could not be reached this session (veloce.gg failed with a repeated TLS handshake
error on fetch; no working R8G Esports URL was found via search), so they are excluded from the
table rather than guessed at.

| Site | Homepage section order (top→bottom) | Results/standings | Calendar / next event | Roster | Sponsor band | Join/apply CTA | Shop | Live social feed | Primary CTA wording | Heavy scroll animation |
|---|---|---|---|---|---|---|---|---|---|---|
| [Apex Racing Team](https://apexracingteam.co.uk/) (UK, multi-sim incl. iRacing/Porsche Supercup) | Nav → hero/merch promo → 3 feature blocks → about → photo gallery → sponsor logos → series/competition write-ups → footer | No | No | No dedicated roster module | Yes | No | Yes (prominent) | No | "Buy Now" (merch) | No — static/linear |
| [Coanda Esports](https://coanda.gg/) (Porsche Coanda) | Nav (Results/News/Team/Media in menu) → hero → partners band → about → news grid → 10-driver roster cards → partners repeat → media gallery → "social feed" placeholder → footer | Linked in nav only, not on homepage | No | Yes (10 drivers) | Yes, twice | No | No | Placeholder section, not actually live | "Check our news" / "Meet the team" | Not detected |
| [Williams F1 Team Gaming](https://www.williamsf1.com/gaming) | Nav (Shop/Partners) → hero → 4 pillars (Gaming/Esports/Education/Events) → social links → trending links (incl. Race Schedule, Standings) → shop categories → careers/partners → footer | Linked out, not embedded | Linked out, not embedded | No driver cards | Yes, extensive | Yes — "Careers" (buried in footer-level nav) | Yes (multiple categories) | No | No single dominant CTA — four parallel pillars | Not detected |
| [Mercedes-AMG Petronas Esports](https://www.mercedesamgf1.com/esports) | Nav → hero → team overview → 2025 schedule table → standings (P3, 198 pts) → honours timeline 2018–2022 → 4-driver roster w/ bios → esports-specific partners → socials → full partner grid → footer | Yes, embedded table | Yes, embedded schedule | Yes (4 drivers, full bios) | Yes, two tiers | No | Linked in header only | No, static follow buttons only | None — informational hub, no conversion CTA | Not detected |
| [Team Redline](https://racing.verstappen.com/team-redline/) (now under Verstappen Racing) | Nav (incl. Shop/Tickets) → hero image → team description → 12-driver roster grid → 2 partner logos → footer | No | No | Yes (12 drivers, incl. Max Verstappen) | Yes (small — 2 logos) | No | Yes (nav link) | No | No standalone CTA button | No — static |

**Patterns that repeat across the credible sites:**
- A driver/roster grid with photos is close to universal (4 of 5 sites) — it's treated as core content, not an afterthought.
- A sponsor/partner logo band appears on every single site analyzed, often twice (once high, once in the footer region) — this is the one element every team, however small, includes.
- None of the 5 sites uses scroll-jacking, pinned sections, or parallax — the "heavy scroll animation" pattern Artemis is using is not something any of these real competitor/reference sites actually do, which is worth weighing against the brief's stated design direction.
- Results/standings only get a real embedded module on the most resource-rich site (Mercedes); smaller independent teams (Apex, Team Redline) skip results entirely on-page and rely on the roster and history to carry credibility instead.
- A genuinely live social feed embed is essentially absent — even Coanda's "social feed" section reads as an unpopulated placeholder rather than a working widget.

**What to avoid:**
- Don't make a merchandise "Buy Now" the site's primary CTA (Apex's pattern) when the actual business goal is driver recruitment and sponsor interest — it optimizes for the wrong outcome.
- Don't push results/standings behind an external link with nothing on-page (Williams' pattern) — for a small team with "tiny social following," real results are the credibility asset, so they should be visible without a click.
- Don't ship a "social feed" section that isn't actually live (Coanda's pattern) — an empty or broken-looking widget undermines exactly the trust it's meant to build; a manually curated highlights strip is more honest at this team's scale.

---

## 3. Implications for Artemis's 4 pages

**Recommended Home order:** (1) Hero — team name/tagline ("Artemis Esports — On the hunt"), one
line stating iRacing endurance/GT + NASCAR oval focus, one proof point (latest result/podium), one
primary CTA ("Join our Discord") — all visible without scrolling, per the F-pattern/first-screen
evidence (#1) and single-CTA evidence (#6). (2) A lightweight "Next Race" countdown/calendar strip —
the return-visit driver from #7. (3) A "Recent Results" ticker (last 3–5 races, series, finish) —
the social-proof substitute for follower count, from #8. (4) A 5-driver roster teaser linking to the
Team page — matches the near-universal roster pattern from Section 2. (5) A "Partner With Us" teaser
(not an empty sponsor-logo band, since there are no sponsors yet) linking to Partners — avoids the
awkwardness of a visibly empty logo row while still asking, per #9. (6) Footer with Discord/socials.
Use ordinary scroll-reveal only (no pinning/hijacking) with `prefers-reduced-motion` support, per #4,
and keep the hero asset compressed with explicit dimensions so LCP stays under 2.5s per #2–#3.

**Team page** must serve driver-applicant and fan audiences: full 5-driver roster with photos,
iRating/Safety Rating or equivalent iRacing stats, class/discipline (endurance/GT vs oval), and
links to each driver's results — this doubles as recruiting proof and sponsor-facing credibility.

**About page** should carry the team story/"On the hunt" identity, the discipline focus, and a short
"how to join" explainer with the Discord CTA repeated — per #12's flat-navigation logic, a
5-driver team's content volume does not justify a separate "Join" page; fold it into About plus the
homepage CTA instead of adding a 5th top-level page.

**Partners page** is the sponsor 60-second check: recent results/achievements, roster snapshot,
honest audience/reach numbers, and a direct contact or media-kit CTA — the trust-package pattern
from #9, reinforced by what Mercedes/Coanda/Williams all bundle for their own partner-facing content.

**Results/Calendar — section, not a page:** given the 4-page constraint and thin content volume
(one small team's schedule), fold "Next Race" and "Recent Results" into Home-page modules rather
than new top-level pages, consistent with #12 and with how even Team Redline and Apex (smaller,
independent teams) skip a dedicated results page. Revisit as a standalone page only if race volume
or media coverage grows enough to justify the extra navigation depth.

---

## 4. Sources

| URL | What it supported |
|---|---|
| https://web.dev/articles/defining-core-web-vitals-thresholds | LCP/INP/CLS threshold definitions |
| https://www.nngroup.com/articles/scrolljacking-101/ | Scrolljacking usability/disorientation study |
| https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content-discovered/ | F-pattern scanning, 20-28% read |
| https://baymard.com/blog/line-length-readability | Optimal 50-75 character line length |
| https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf | Google/SOASTA bounce-vs-load-time stats (fetch failed, via search) |
| https://business.google.com/uk/think/marketing-strategies/mobile-page-speed-load-time/ | Mobile load time / conversion figures, via search |
| https://apexracingteam.co.uk/ | Reference site: homepage structure, merch-led CTA |
| https://coanda.gg/ | Reference site: homepage structure, roster, fake-feel social feed |
| https://www.williamsf1.com/gaming | Reference site: pillar structure, linked-out results |
| https://www.mercedesamgf1.com/esports | Reference site: embedded schedule/standings, honours |
| https://racing.verstappen.com/team-redline/ | Reference site: roster-led, no results module |
| https://dev.to/linou518/core-web-vitals-2025-complete-guide-how-to-handle-inp-and-tighter-thresholds-24hf | Secondary CrUX pass-rate figures (62%/77%) |
| https://sqmagazine.co.uk/esports-statistics/ | Mobile esports viewership ~56% (secondary aggregator) |
| https://wisernotify.com/blog/call-to-action-stats/ | Single-CTA conversion lift claims (vendor blog) |
| https://www.sender.net/blog/call-to-action-statistics/ | CTA count benchmarks (vendor blog) |
| https://firework.com/blog/impact-video-content-landing-page-conversion-rates | Video vs static conversion lift (vendor blog) |
| https://scopicstudios.com/blog/video-marketing-vs-static-content-stats-and-trends/ | Video engagement claims (vendor blog) |
| https://webselect.agency/content-freshness-user-engagement-signals/ | Content-freshness dwell-time claim (vendor blog, unverified) |
| https://www.trustsignals.com/blog/trust-badges-work-and-we-have-the-receipts-to-prove-it | Baymard trust-badge figures (vendor blog summarizing Baymard) |
| https://ecomhint.com/guides/homepage-optimization | Baymard 2025 mobile homepage benchmark (67% mediocre/poor), via secondary summary |

**Not used / could not verify:** Veloce Esports (veloce.gg) — TLS handshake failure on fetch,
excluded from Section 2. R8G Esports — no working homepage URL located within search budget,
excluded from Section 2. WCAG-specific numeric contrast/motion success-criteria were referenced only
as practitioner consensus, since the W3C specification itself was not fetched this session.
