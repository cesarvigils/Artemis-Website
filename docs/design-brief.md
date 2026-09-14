# Artemis Esports website — redesign brief (orchestrator's decisions)

Project: `D:\Artemis\Website\Website` (Astro 7, static, `format: 'directory'`, deps: astro, gsap, lenis). Node 24. Build: `npm run build` → `dist/`. Deploy target is a plain cPanel/LiteSpeed host; the site must stay fully static.

Backup of the pre-redesign tree: `<scratchpad>\backup-website-baseline.zip`. Baseline screenshots: `<scratchpad>\shots\baseline\`. Screenshot tool: `<scratchpad>\shots-tool\shot.mjs` (see its README/usage in the structure report). Structure report: `<scratchpad>\site-structure.md`. Retention research: `<scratchpad>\retention-research.md`. Brand vectors: `<scratchpad>\brand-vector\`.

`<scratchpad>` = `C:\Users\Baylo\AppData\Local\Temp\claude\D--Artemis\a46d919c-5ff2-47bd-8525-e586a513a237\scratchpad`

## 1. Who this is for and what "good" means

Three audiences, in priority order:
1. **Sim racers deciding whether to apply** (the org's only real growth lever). They want: is this team real, who's on it, what do they race, what have they done, how do I join. Primary CTA site-wide: **Join the team → Discord** (`https://discord.gg/ybSQQk9axG`).
2. **Sponsors/partners doing a 60-second check.** They want: results, roster, cars/liveries (where their logo would go), audience/social links, a contact.
3. **Fans/followers** who come back for results and the next race.

Success = a visitor understands in 5 seconds that Artemis is an active iRacing team with results, and has a reason to scroll (results, cars, roster, next race) and a reason to return (results/calendar freshness). Not success = a beautiful page of slogans.

## 2. Identity (fixed — identity preservation wins)

- Brand: **Gen3** system. Teal `#0fffcf` on near-black `#000a08`, light-mint ink `#ebfffb`, the leaf-and-profile "Artemis" mark, the ARTEMIS ESPORTS wordmark, the spray-painted "HUNT" texture (`src/assets/Background.png`), tagline "On the hunt" / "#OnTheHunt". These tokens already exist in `src/styles/global.css`; keep them, refine them (contrast, surfaces, a text-on-teal ink), don't replace them.
- Type: **Nexa** Bold (700) and Light (300) are the only licensed weights on disk (`public/fonts/*.woff2`). Hierarchy must come from size, tracking, colour and case, not extra weights. Add exactly one contrasting family for data (results, numbers, timestamps, driver numbers): a self-hosted open-licence monospace (IBM Plex Mono or JetBrains Mono via `@fontsource/*`, woff2 only, 1–2 weights, `font-variant-numeric: tabular-nums`). Nothing else.
- Imagery: real in-sim renders already in `src/assets/racing/` and photos in `src/assets/photos/`. No stock, no AI imagery, no illustrations. The Gen3 mark SVG (from `brand-vector/`) replaces raster logos in nav/footer/favicon-sized uses.

## 3. Direction (one, committed): "pit wall, not billboard"

Keep the dark-teal identity, but change the register from *agency motion showcase* to *a racing team with evidence*. Visual vocabulary borrowed from the pit wall and the timing tower: tabular numerals, hairline rules, position markers (P1/P4), sector-style progress lines, dense-but-calm data rows, generous whitespace around them. Motion is present and precise, never the content. Asymmetric layouts, no equal-card grids, no eyebrow-kicker on every section, no numbered section markers, no gradient text, no glass cards, no hero-metric template (see impeccable "Absolute bans").

Taste route: `taste/reference/design-taste-frontend.md` (default anti-slop) + `taste/reference/redesign-existing-projects.md` (audit-then-fix). Impeccable register: `impeccable/reference/brand.md` (design IS the product) + the General rules and Absolute bans in `impeccable/SKILL.md`. Motion: `emil/reference/emil-design-eng.md`.

## 4. Information architecture (decided after the research brief — read `retention-research.md` §1 and §3 for the evidence)

Pages stay flat: `/` (home), `/team`, `/about`, `/partners`, `404`. **No new top-level pages.** Results and the next race are Home modules (research §3: flat nav; results on-page, not linked out). Nav: Team · About · Partners · [Join the team] (button → Discord). Footer: all real socials, store, contact, "© Artemis Esports".

One primary CTA per page (research #6): Home, Team, About → **"Join the team"** (Discord). Partners → **"Partner with us"** (mailto). At most one secondary action per page, visually quieter.

Home, in order:
1. **Hero** — first screen, no waiting for animation, must say: Artemis Esports, an iRacing endurance/GT and oval team, one proof point (latest podium/result), primary CTA "Join the team", secondary "See results" (anchor to the results module). Best car render as the image, preloaded, LCP ≤ 2.5 s.
2. **Next race** — a thin strip: event · track · date · classes, from `events.json`. A countdown is optional and must be JS-enhanced only (static date text without JS).
3. **Results** — the last 5–6 results in timing-tower rows (position badge, event, track, series/class, driver, date) from `results.json`. This is the social proof (research #8); it must be on-page.
4. **The garage** — current liveries/cars. **Native** horizontal scroll with scroll-snap on every device (no pinning, no scroll-jacking — research #4, NN/g). Cap at 6 slides. Arrow buttons on desktop; a progress indicator driven by the native scroll position is fine.
5. **Drivers** — 4–6 roster cards (number, name, focus, country) linking to `/team`.
6. **How we race** — the four pillars as ONE compact band (not four screens).
7. **Partners** — one band: the existing partner logo(s) plus "Partner with us" copy and link. Never an empty logo row.
8. **Join** — the Discord CTA with what happens next (open a ticket, share your iRacing name and iRating, get placed in a car within two weeks).

`/team`: full roster grouped road / oval / crew; each card: number, name, country, focus, one-line bio, socials, and a stats slot (iRating, licence) rendered only when present; "Race with us" block with the Discord CTA at the bottom. `/about`: origin (founded 2017; sim racing since 2023), the three photos, the four values, hashtags, a short "how to join" explainer with the Discord CTA (research §3 folds Join into About). `/partners`: the sponsor's 60-second dossier (research #9): what a partner gets (livery placement, result posts, roster exposure, Discord community), a results snapshot, roster snapshot, honest reach line (no invented numbers; show the channels, not follower counts), current partners, contact via mailto. `404`: branded, links home and to Discord.

## 5. Content and data decisions

- Extend `src/data/`: add `results.json` (`{date, event, track, series, class, position, driver, note}`), `events.json` (`{name, track, date, classes, status}`), keep `drivers.json`, `cars.json`, `partners.json`, `site.json`.
- **Fill `site.json` socials with the real public handles**: X `https://x.com/EsportsArtemis`, Instagram `https://instagram.com/esportsartemis`, TikTok `https://tiktok.com/@esportsartemis`, YouTube `https://youtube.com/channel/UCE6v3WL651IvusgiD3dJzxg`, Twitch `https://twitch.tv/esportsartemis`, Discord `https://discord.gg/ybSQQk9axG`, Store `https://raven.gg/stores/esports-artemis`. Contact stays `contact@artemisesports.com`.
- Drivers and results: the owner has not approved publishing real names. Use **realistic placeholders** (varied, non-generic names; real tracks/series/dates are fine) and mark each placeholder record with `"_placeholder": true` (never rendered). Put a `## Fill in` section at the top of CONTENT.md listing exactly which records are placeholders. Real events that may be used as-is: Suzuka 1000 (Sep 2026), Petit Le Mans (25–27 Sep 2026, Road Atlanta), Daytona 24 (Jan 2026), Watkins Glen 6h (Jun 2026), Sebring 12h (Mar 2026), Friday Night Lights league, CTC Racing truck league.
- Partners: keep GLYTCH as-is. Do not add NordVPN or anyone else.
- Copy: plain, specific, sentence case for body; the brand's uppercase display voice is fine for headings. No "elevate/seamless/unleash/next-gen". No exclamation marks.

## 6. Motion and performance rules

- **Remove Lenis** (native scroll) and **remove every pinned / scrub-driven section** (the pillars stack and the garage pan). NN/g's scroll-jacking study (research #4) is the strongest evidence in the brief and every reference site avoids it. Keep GSAP for: hero entrance (≤ 1.2 s total, staggered mask reveal that never delays the first paint of the headline text), a light hero parallax (transform only), row/section reveals that enhance already-visible content, and micro-interactions. No pinned slogan panels. No marquee text. If GSAP ends up used only for reveals, replace it with CSS + IntersectionObserver and drop the dependency.
- Fix the structural debts listed in `site-structure.md` §"Inconsistencies": single source of truth for nav/footer links (a `nav.json` or exported const), headline derived from `site.json`, no brittle `startsWith('precision')` accent, no duplicate hero/garage image, remove the dead `--z-menu` or use it, set the footer year client-side with a build-time fallback.
- Every animation has a `prefers-reduced-motion` alternative. Nothing is invisible without JS. Transitions on interactive elements 150–250 ms with exponential ease-out; no bounce.
- Targets on the built site (`dist/`): LCP element = hero image, preloaded, ≤ 250 KB webp at 1440 px; total JS ≤ 120 KB gzipped; CLS ≈ 0 (explicit image dimensions, font preload with `font-display: swap`); Lighthouse ≥ 95 in all four categories at mobile preset.
- The current build copies the raw multi-MB originals into `dist/_astro` alongside the webp derivatives (dist is 72 MB; e.g. `sebring-mustang-rear.*.jpg` 7.5 MB ships). Fix the cause (an image's raw `.src` referenced somewhere, or images placed where Astro can't optimise them) so `dist/` ships only sized webp/avif and totals under ~15 MB. You may also downscale source images in `src/assets` to ≤ 2560 px on the long edge to speed builds; keep originals out of the repo if you do (move them to `<scratchpad>\originals\`).
- The site's `src/assets/logos/Artemis White Logo.png` is the correct Gen3 mark in white (verified); `Icon.png` is the mark on a textured square (use only as a fallback favicon/OG source); `Logo_Layout_1.png` is the horizontal lockup.
- Accessibility: skip link, visible focus rings, ≥ 4.5:1 body contrast on dark, `aria-current="page"` in nav, semantic landmarks, alt text on all meaningful images, mobile menu with correct `aria-expanded` and Escape-to-close.
- Responsive: designed at 390, 768, 1024, 1440. Headlines must not overflow at 390. `100dvh`, never `100vh`.

## 6b. Final deliverable format (owner decision, 13 Sep 2026): no Astro, no build step

The owner does not want the site to depend on Astro or Node. Pass 1 is built in Astro because components make the first build fastest; immediately after pass 1 the site is **converted to plain static files** and passes 2–5 polish that version. Conversion rules:
- Output folder `D:\Artemis\Website\Website\site\` (inside the git repo, next to the Astro source, so it is pushed with everything else and can be set as the publish directory on Cloudflare Pages / cPanel): `index.html`, `team/index.html`, `about/index.html`, `partners/index.html`, `404.html`, `assets/css/site.css`, `assets/js/site.js`, `assets/js/data.js`, `data/*.json`, `assets/img/**` (pre-exported webp at 640/1280/1920 widths + the few PNG/SVG brand files), `assets/fonts/*.woff2`, `favicon.*`, `og.png`, `robots.txt`, `sitemap.xml`.
- Nav/footer are repeated verbatim in each page (5 pages; a comment marks the block so a find-and-replace keeps them in sync).
- `results.json`, `events.json`, `drivers.json`, `partners.json` are fetched client-side by `data.js` and rendered into marked containers; each container ships a static fallback (the same rows rendered once by hand) inside `<noscript>` or as initial markup that JS replaces, so nothing is blank without JS.
- GSAP (if still needed) from `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.x/gsap.min.js` + ScrollTrigger; otherwise CSS + IntersectionObserver.
- No hashed filenames, no bundler output; readable, commented CSS/JS a volunteer can edit. Deploys by copying the folder to cPanel `public_html/` or drag-and-drop to Cloudflare Pages.
- `CONTENT.md` and `DEPLOY.md` are rewritten for the no-build workflow (edit JSON → upload the one file; add an image → export webp at squoosh.app → drop in `assets/img/`).

## 7. Process (for the builder)

1. Read: this brief; `site-structure.md`; `retention-research.md`; `brand-vector/README.md`; then the skill references listed in §3 (load the skills via the Skill tool: `anthropic-skills:taste`, `anthropic-skills:impeccable`, `anthropic-skills:emil`, and read the named reference files fully).
2. Write `PRODUCT.md` and `DESIGN.md` in the project root (impeccable's convention) recording the decisions you make within this brief (tokens, type scale, spacing scale, motion vocabulary, component list). The impeccable `context.mjs` script is not installed in this project; skip it and treat these two files as the context.
3. Implement across all pages. Keep the Astro stack; no UI frameworks; only new dependency allowed is one `@fontsource/*` mono package. Keep `format: 'directory'` and the `site` URL. Keep `CONTENT.md`/`DEPLOY.md` accurate (update them for new data files/pages).
4. `npm run build` must pass with zero warnings you introduced. Then run the screenshot tool against `dist/` into `<scratchpad>\shots\r1\` and look at every screenshot yourself before declaring done. Fix what you see.
5. Do not commit. Do not touch `node_modules`, `dist` (other than via build), or anything outside `D:\Artemis\Website\Website` and the scratchpad.
