# Pass 4 — Critique F: motion craft, micro-interactions, delight

Reviewer: design engineer, read-only. No project file was edited.

Method: `anthropic-skills:emil` (review path — `emil-design-eng.md`, `review-animations.md`,
`review-animations.STANDARDS.md`) and `anthropic-skills:impeccable` (`animate.md`, `delight.md`,
`interaction-design.md`), read in full before touching the site. Then `npm run build` (clean) and four
instrumented playwright-core runs against `dist/` in the OS Chrome at 1440×900 and 390×844.

Tooling: `<scratchpad>\motion-tool\` — `hero.mjs`, `interact.mjs`, `mobile.mjs`, `garage.mjs`,
`frames.mjs`, `lib.mjs`.
Output: ~90 frames + 4 measurement JSONs in `<scratchpad>\shots\r3-motion\`.

Entrance frames are **exact**: every `DocumentTimeline` animation is `pause()`d and seeked before
capture (`frames.mjs`, `f-*.png`), so a frame labelled 300 ms is 300 ms. The first run
(`d-hero-enter-*.png`) used a CSS `animation-play-state` freeze that Chrome ignored; those frames run
~120 ms late and are superseded by the `f-` series. The numeric tables in `hero-measurements.json`
were read synchronously after each seek and are exact in both runs.

---

## 0. Headline

The motion **system** is in good shape and three passes of fixes are holding: no scroll-jacking, no
`ease-in`, no `scale(0)`, no bounce, no live `transition: all`, custom cubic-beziers throughout, every
`:hover` gated behind `(hover: hover) and (pointer: fine)`, the parallax is CSS scroll-driven off the
main thread, the LCP image no longer fades, the skip link is deliberately instant, and `.reveal` can
never be the reason content is missing. **There is no P0 and nothing here blocks.**

What is wrong is the *distribution*. Motion is concentrated where the site has nothing to say yet (the
wordmark, 840 ms of it) and absent where the site is actually about something (the results rows, the
position badge, the countdown, the whole mobile menu). Six interactive element families have a hover
state and no press state; the nav underline answers the mouse and ignores the keyboard; the one control
that opens navigation on a phone has no state at all. And the site's single most-used device — the
`P2 / of 41` position marker — never moves, anywhere.

Verdict against the emil review path: **Approve with findings.** No feel-breaking regression, no
keyboard-action animation, no non-GPU animation with an easy fix. The findings are missing feedback and
inconsistent tiers, not broken motion.

---

## 1. Before | After | Why

| Before | After | Why |
| --- | --- | --- |
| `Nav.astro:330-346` + `site.ts:102-120` — `menu.hidden = !open` toggles a full-screen panel with `animation-name: none`, 0 running animations; `Nav.astro:103-105` `.site-nav { transition: background-color var(--dur-ui) }` still crossfades behind it | `.mobile-menu { transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out); @starting-style { opacity: 0; transform: translateY(-8px) } }` and `[hidden] { opacity: 0; transform: translateY(-8px); transition-duration: 150ms }` inside `@media (prefers-reduced-motion: no-preference)`; or, if the instant swap is kept, `:global(html.menu-open) .site-nav, :global(html.menu-open) .site-nav::before { transition-duration: 0s }` | The panel snaps in 0 ms while the bar above it fades for 240 ms, so for a quarter of a second the header and the panel are different colours with hero foliage showing between them (`m-menu-open-f0.png` at +104 ms vs `m-menu-open-f5.png` at +289 ms). Pass 2 C20 left this open as "defensible as crisp"; it is not, because half of it already animates. Pick one. |
| `Nav.astro:273-285` — `.menu-toggle` has no `transition`, no `:hover`, no `:active`; measured `transition-property: all / 0s` | `.menu-toggle { transition: color var(--dur-hover) var(--ease-out), transform var(--dur-press) var(--ease-out) } .menu-toggle:active { transform: scale(0.97) }` + a `@media (hover: hover)` colour step | Every `.btn` on the site presses (`scale(0.97)`), including the compact CTA 10 px to its left. The hamburger — the only way to reach navigation on a phone — is the one control that gives nothing back. impeccable `interaction-design.md`: eight states, none optional. |
| `Nav.astro:291-298` — `.menu-icon-close { display: none }` / `[aria-expanded='true'] .menu-icon-open { display: none }` | Stack both icons in one grid cell and crossfade: `.menu-icon { grid-area: 1/1; transition: opacity var(--dur-press) var(--ease-out) }`, swap `opacity` on `aria-expanded` | A `display` swap cannot transition, so the glyph teleports. 120 ms of opacity costs nothing and makes the toggle feel connected to the panel it opens. |
| `site.ts:266-273` — `const slide = track.querySelector('.garage-slide'); const amount = slide.getBoundingClientRect().width + 32` | Step to the next slide's own snap position: `const slides = [...track.querySelectorAll('.garage-slide')]; const pad = parseFloat(getComputedStyle(track).scrollPaddingInlineStart) \|\| 0; const list = track.querySelector('.garage-track'); const stops = slides.map((s) => s.offsetLeft - list.offsetLeft - pad); const here = track.scrollLeft; const to = direction === 1 ? stops.find((s) => s > here + 4) : [...stops].reverse().find((s) => s < here - 4); track.scrollTo({ left: to ?? (direction === 1 ? track.scrollWidth : 0), behavior: reduceMotion.matches ? 'auto' : 'smooth' })` | `querySelector` returns the **first** slide, always. The five slides are 276 / 614 / 276 / 614 / 806 px wide, so "Next car" always requests 308 px regardless of what is on screen, and the `+ 32` does not match the real 24 px gap either. Measured presses move 300 / 639 / 300 / 157 px. It lands correctly today only because Chrome resolves mandatory snap in the direction of travel; a browser that snaps to the *nearest* point would make press 2 move nothing. |
| `Nav.astro:222-229` — `.nav-link:hover::after { transform: scaleX(1) }` only | `.nav-link:focus-visible::after { transform: scaleX(1) }` (keep the hover rule inside the hover media query; the focus rule belongs outside it) | Measured focus walk: every focused `.nav-link` reports `::after` `matrix(0,0,0,1,0,0)` — scaleX(0). A keyboard user gets the outline ring and never the underline, so the affordance that says "this one" is mouse-only. `interaction-design.md`: "the common miss — designing hover without focus." Same gap on `Footer.astro:146-152`, where focus leaves the colour at `rgba(235,255,251,0.78)`. |
| `global.css:452-454` `.btn:active { transform: scale(0.97) }` and `Garage.astro:127-129` `.garage-btn:active { transform: scale(0.94) }`; no `:active` at all on `.nav-link`, `.mobile-links a`, `.footer-col a`, `.footer-email`, `.text-link`, `.driver-compact > a`, `.driver-socials a`, `.notfound-links a` | One token, `--press-scale: 0.97`, on both buttons; for text links a non-scaling press instead — `.text-link:active, .footer-col a:active, .nav-link:active, .mobile-links a:active { opacity: 0.65; transition-duration: var(--dur-press) }` | Two press scales for the same gesture is two answers to one question, and 0.94 is outside the 0.95–0.98 band emil specifies. More importantly eight of ten pressable families never acknowledge the press: on a phone, tapping a menu item gives no feedback before the page changes. Press ≠ hover ≠ focus is the whole point of the state table. |
| `global.css:559-564` — `@keyframes enter-up { from { opacity: 0; transform: translateY(16px) } }` at `--dur-entrance: 560ms` with delays 180 / 230 / 280 ms | `--dur-entrance: 420ms`; delays `0 / 60 / 120 / 160 / 200ms`; and start the fade from `opacity: 0.25`, not `0`, so the copy column is never empty | At t=0 the hero copy column renders **completely blank** (`f-hero-copy-0000ms.png` — a black rectangle); at 300 ms the primary CTA is at `opacity: 0.136`; the sequence settles at 840 ms. It also contradicts the site's own documented invariant, `DESIGN.md:261` "Nothing is ever animated from `opacity: 0`". The proposed values put the CTA above 60 % at ~330 ms and settle at 620 ms, still a staggered entrance, nothing blank. |
| `site.ts:194-219` + `NextRace.astro:141-147` — `el.textContent = \`In ${days}d…\`` on a 30 s `setInterval`, `el.hidden = false`, no transition (`transition-property: all / 0s`, `animation-name: none`) | Align the tick to the minute boundary (`setTimeout(…, 60000 - (Date.now() % 60000))` then `setInterval(…, 60000)`), fade the element in once on first render (`opacity` 0→1 over `--dur-ui`), and crossfade the minute field on change | A timing-tower site shipping a clock that is up to 30 s stale is a register failure, not just a polish one. And the line appears out of `hidden` with a hard pop — the space is already reserved by `min-height: 2.6em`, so the fade is free. |
| `global.css:599-607` — the reduced-motion block rewrites `transition-property` to six properties but leaves each element's own `transition-duration` list untouched | Add `transition-duration: var(--dur-hover) !important;` to the same rule | CSS cycles the shorter list, so the durations land on the wrong properties. Measured on `.btn`: property list `opacity, color, background-color, border-color, fill, stroke` against durations `0.12s, 0.18s, 0.18s, 0.18s` → `opacity` inherits the 120 ms *press* duration and `fill` gets 120 ms. On `.garage-btn` the hover border-color drops from 180 ms to 120 ms under reduced motion. Invisible, wrong, and one line to fix. |
| `GarageSlide.astro:65-69` and `about.astro:235-239` — `:hover { transform: scale(1.03) }` on figures that are not links (`slideIsLink: false`, `shotIsLink: false`) | Either make the frame do something on click (open the full render, or link the car to its results), or delete the zoom and keep the frame still | `ResultsTable.astro:223` refuses a row hover with exactly the right reason — "a background change promises a click that does not exist" — and `DESIGN.md:26` lists "hover states on rows that are not clickable" as deliberately absent. The same promise is being made by a photo that scales under the cursor. One of the two rules has to go. |
| `Garage.astro:122-125` — `.garage-btn:disabled { opacity: 0.3 }` | `opacity: 0.45` on the icon only, keeping the border at full `--line` strength, so the control keeps its footprint | The disabled arrow composites to ≈2.5:1 against `--bg` (`#ebfffb` at 0.3α over `#000a08`). Disabled controls are exempt from WCAG 1.4.11, so this is not a violation — but at 2.5:1 the arrow reads as *gone*, not as *unavailable*, which defeats the `visibility` trick two rules above that deliberately preserves the row's height. |
| `site.ts:248-253` — `progress.style.width = …` and `progress.style.transform = …` together inside the rAF scroll update | Write `width` only from the resize path; leave `transform` in the scroll path | Instrumented over 30 scroll steps: `distinctWidthValues: ["50.776%"]` — the width never changes during a scroll. A layout-driving property is being re-written every frame of a scroll handler to the value it already has. The measured cost today is nil (Blink short-circuits identical values); the shape is still the one emil Standard 7 names, and it is two lines to move. |
| `DriverCard.astro:128-142` + `:144-153` + `:171-179` — hover sets `color`, `-webkit-text-stroke-color` and `.driver-name` colour; only `color` is in a transition list (`var(--dur-ui)`), `.driver-name` has none | One duration for the set: `.driver-compact .driver-number { transition: color var(--dur-hover) var(--ease-out), -webkit-text-stroke-color var(--dur-hover) var(--ease-out) }` and `.driver-compact .driver-name { transition: color var(--dur-hover) var(--ease-out) }` | Measured 90 ms into the hover: number fill `rgba(15,255,207,0.92)` (easing over 240 ms), stroke already `rgb(15,255,207)` (snapped, not in the list), name already `rgb(15,255,207)` (`transition-property: all / 0s`). Three elements of one hover on three clocks. emil's slow-motion checklist: "are multiple animated properties in sync?" |
| `404.astro` — no `[data-enter]`, no `.reveal`, `document.getAnimations()` returns `[]` | Give the 404 the same `[data-enter]` grammar the other four pages use: `<h1 data-enter>`, lead at `--enter-delay: 60ms`, actions at `120ms` | Home carries 6 entrance animations, `/partners` 5, `/about` 3, `/404` zero. It is the only page that breaks the site's own entrance grammar, and — per `delight.md` — an error page is exactly the "rare / first-time" row of the frequency table where personality is cheapest and most welcome. |
| `index.astro:78-100` — the results module has no entrance; the 7 `.reveal` elements on `/` are 4 pillars + 3 join steps | Per-row stagger on the rows themselves: `<tr class="reveal" style={\`--reveal-delay: ${i * 45}ms\`}>`, capped at 6 rows = 225 ms total | Motion budget is inverted: the decorative "how we race" band and the join explainer animate, the module the brief calls the social proof does not. This is not a reversal of pass 2 C8 — C8 removed `.reveal` from the wrapper `<div>` and explicitly kept it on "genuine sibling lists". Six result rows are a genuine sibling list, and a timing tower filling row by row is the one entrance that is *about* what it reveals. |
| `Base.astro:104-112` + `site.ts:54-64` — `[data-nav-sentinel]` is `height: 1px` at `top: 0`, observed at `threshold: 0` | `height: 64px` on the sentinel (or `rootMargin: '-64px 0px 0px 0px'` on the observer) | The header flips to solid at roughly 2 px of scroll, and back again, with a 240 ms crossfade each way — a hair trigger on a quarter-second animation. Trailing a 64 px lead-in means the bar changes once the hero has actually begun to leave, not when the page twitches. |
| `global.css:410-421` — `.text-link svg { transition: transform 180ms }`, `:hover svg { translateX(3px) }`; no equivalent on `.btn svg`, `.mobile-links a svg`, `.footer-col a svg`, `.nav-cta svg` | Apply the nudge to every arrow-carrying link — `:where(.text-link, .btn, .footer-col a, .mobile-links a):hover svg { transform: translateX(3px) }` — or remove it from `.text-link` | Five link families carry the same arrow icon and exactly one of them moves it. A micro-interaction that appears on 20 % of the instances of its own pattern reads as an oversight, not a signature. Either is defensible; the split is not. |

---

## 2. Signature moment

### What it is now

The hero: two headline lines rising out of an `overflow: hidden` mask 70 ms apart
(`global.css:566-570`, `Hero.astro:48-51`), over a photo that settles from `scale(1.04)` and then drifts
5 % on a scroll-driven timeline (`Hero.astro:247-267`). `DESIGN.md:249` names the masked line rise as
the move that "sets the pace of the page once, at the only moment there is nothing to read yet".

Measured: mask travel 78.95 px (105 % of the line box), `ease-out-quart`, 71.7 % complete at 150 ms,
95 % at 300 ms, settled at 600 ms; parallax −14.85 px at scrollY 0 → +34.65 px at scrollY 900, on a
real `ScrollTimeline` (off the main thread), correctly `@supports`-gated and absent under reduced
motion.

### Does it earn its place?

**No — as a signature.** It earns its place as craft, and it should stay as the site's entrance
*grammar*. But it is not a moment anyone will remember, and it is consuming the whole allowance.

Three reasons:

1. **It is category-generic.** A two-line masked wordmark rise over a dark hero photo with a slow
   parallax is the most-reproduced "designed hero" of the last five years. Nothing in it is about
   racing, timing, endurance, or this team; drop a law firm's name into it and it is unchanged. The
   impeccable second-order reflex check ("dark sports brand that isn't a SaaS hero → masked line rise
   + parallax") lands on it exactly.
2. **It is not a moment, it is the grammar.** `[data-enter]` / `[data-enter-mask]` is the standard
   entrance on `/`, `/partners` and `/about`. A device used on three of five pages is a system, and a
   signature is by definition the thing that happens in one place.
3. **It is spent at the wrong time and costs real legibility.** It animates the moment the page has
   nothing to say, and the price is a copy column that is literally blank at t=0
   (`f-hero-copy-0000ms.png`) and a primary CTA at 13.6 % opacity at 300 ms. A visitor moving Home →
   Team → About replays the 840 ms sequence three times in a minute — the "tens of times a day" row of
   emil's frequency table, which says *reduce*.

### Proposal — the position badge settles

Within the brief (no scroll-jacking; transform/opacity only; exponential ease-out; reduced-motion
alternative; nothing invisible without JS; **one** signature moment).

The site already has a visual signature and it is not the wordmark: it is the **P-marker**. `P2 / of 41`
on a teal rule in the hero (`Hero.astro:61-64`), `P2` with a 2 px teal podium underline in every results
row (`ResultsTable.astro:133-136`). It appears nowhere else on the internet in this form, and it is the
single most persuasive element on the first screen.

Make it arrive the way a result arrives on a timing tower:

- The hero position marker counts **down from the field size to the finish**: `P41 → P2`, eased with
  `--ease-out-quart` over ~420 ms, starting at `--enter-delay: 200ms` so it lands *after* the headline.
  The type is already `font-variant-numeric: tabular-nums` in `--font-mono`, so no glyph reflows.
- It finishes with the podium rule drawing left-to-right underneath in 160 ms — `transform: scaleX(0) →
  scaleX(1); transform-origin: left center`, the identical primitive the nav underline already uses
  (`Nav.astro:201-212`), so the move is new but the vocabulary is not.

Why it earns the allowance:

- **Only this site could do it.** Nobody else's hero counts a car from P41 to P2. That is the whole test.
- **It animates the evidence, not the logo** — brief §4.1's single proof point, the thing a sponsor
  doing a 60-second check is looking for.
- **Nothing is invisible without JS.** The final value `P2` is already in the markup; the enhancement
  reads it, counts to it, and is skipped entirely when `html.js` is absent, when the tab is hidden, or
  in a headless render. ~15 lines in `site.ts`, no dependency.
- **Reduced motion:** render `P2` immediately and draw the rule with opacity only — the same "gentler,
  not zero" treatment `.reveal` already gets.
- **Frequency:** once per load, on one element, on one page. The "rare / first-time" row — the only row
  where the table permits delight.
- **Register:** it is a timing tower, not a flourish. No bounce, no elastic, no confetti. It reads as
  precision, which is the brief's word.
- **Budget:** pair it with the shortened entrance in F6 and the whole first screen still lands under
  700 ms, with the badge last.

It does not add a second signature; it supplies the first one, and demotes the mask to what it already
is — the house entrance style.

**Quieter fallback**, if a counting digit reads as too showy for the pit wall: keep the number static and
draw only the podium rule under it, 160 ms, left to right, at `--enter-delay: 200ms`. Cheaper, near-silent,
still built from the site's own two primitives. I would ship the count.

---

## 3. Ranked findings

| ID | Sev | Where | Issue | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| **F1** | P1 | `Nav.astro:330-346`, `Nav.astro:103-105`, `site.ts:102-120` | The full-screen mobile menu opens and closes with zero motion while the header bar behind it crossfades for 240 ms — the only animating part is the one that should match the panel. | `mobile-measurements.json`: `panelAnimations: 0`, `toggleAnimations: 0`, `linkAnimations: 0`, `animationName: none`. `m-menu-open-f0.png` (+104 ms): panel fully black and fully open, hero foliage still visible through the bar above it. `m-menu-open-f5.png` (+289 ms): bar solid. Same on close (`m-menu-close-f0.png`, +181 ms). | Either animate the panel (`@starting-style`, 200 ms in / 150 ms out, opacity + 8 px translate, inside `prefers-reduced-motion: no-preference`) or set `transition-duration: 0s` on `.site-nav` and `.site-nav::before` while `html.menu-open`. Not both as they are. |
| **F2** | P1 | `Nav.astro:273-285` | `.menu-toggle` has no hover, no press and no transition — the only navigation control on a phone, and the only button on the site with no feedback. | `mobile-measurements.json` `menuToggle`: `transition-property: all`, `transition-duration: 0s`. No `:active` or `:hover` rule exists for the selector. The `.btn`-based compact CTA beside it presses at `scale(0.97)`. | `transition: color var(--dur-hover) var(--ease-out), transform var(--dur-press) var(--ease-out)`; `:active { transform: scale(0.97) }`; colour step inside `@media (hover: hover) and (pointer: fine)`. |
| **F3** | P1 | `site.ts:266-273` | The garage arrow always steps by the **first** slide's width + 32 px, for slides of three different widths, with a gap that is 24 px. Correct behaviour today depends entirely on Chrome resolving mandatory snap in the direction of travel. | `garage-measurements.json`: slide widths `276 / 614 / 276 / 614 / 806`; `stepAmountUsed: 308` on every press; measured travel `300 / 639 / 300 / 157 px`; final press leaves the track 81 px off its own snap point. Gap measured `24px`, code adds `32`. | Compute the target from the next slide's own snap offset and use `scrollTo` (full snippet in §1). Removes the dependency on snap-resolution behaviour and on the hard-coded 32. |
| **F4** | P1 | `Nav.astro:222-229`, `Footer.astro:146-152` | Hover states designed without their focus counterparts: the nav underline never appears for keyboard users, and footer links do not change colour on focus. | `interact-measurements.json` `navLink.focusWalk`: all four focused nav links report `::after` `matrix(0,0,0,1,0,0)`. `d-focus-tab-3.png`: TEAM focused, ring present, no underline. `footer.focus.color` = `rgba(235,255,251,0.78)` = the rest colour. | Move the `::after` rule out of the hover query as `:where(:hover, :focus-visible)::after { transform: scaleX(1) }`; same for the footer colour step. Keep the ring. |
| **F5** | P1 | `global.css:452-454`, `Garage.astro:127-129`, `Nav.astro:184-199` & `:357-370`, `Footer.astro:127-144`, `DriverCard.astro:119-126`, `global.css:393-408`, `404.astro:106-118` | Press feedback exists on 2 of 10 pressable families, and the two disagree with each other (`scale(0.97)` vs `scale(0.94)`, the latter outside emil's 0.95–0.98 band). | `interact-measurements.json`: `.btn` press settles at `matrix(0.97,…)`, `.garage-btn` at `matrix(0.941164,…)`. `.nav-link`, `.mobile-links a`, `.footer-col a`, `.text-link`, `.driver-compact > a`, `.driver-socials a`, `.notfound-links a`: `transform: none` under `:active`, and `footer.press` is byte-identical to `footer.hover`. | One `--press-scale: 0.97` for both buttons; an `opacity: 0.65` step at `--dur-press` for text links (a scaling text link is wrong). |
| **F6** | P1 | `global.css:540-564`, `Hero.astro:54-85` | The hero copy column is empty at t=0 and the primary CTA is 86 % transparent at 300 ms; the sequence settles at 840 ms and replays on every internal navigation. Also contradicts `DESIGN.md:261`, "Nothing is ever animated from `opacity: 0`". | `f-hero-copy-0000ms.png` — a black rectangle, not one word. `frames-measurements.json` `frozenCheck`: t=0 `leadOpacity/proofOpacity/actionsOpacity` all `"0"`, both headline lines at `translateY(78.95)`; t=300 `actionsOpacity: 0.136`; settles 840 ms. | `--dur-entrance: 420ms`; delays `0/60/120/160/200`; `@keyframes enter-up { from { opacity: 0.25; transform: translateY(16px) } }`. CTA >60 % at ~330 ms, settled at 620 ms, nothing ever blank. |
| **F7** | P2 | `site.ts:194-219`, `NextRace.astro:141-147` | The countdown pops out of `hidden` with no transition, swaps its text hard, and ticks on a free-running 30 s interval, so the displayed minute is up to 30 s stale. | `interact-measurements.json` `countdown`: `transition-property: all / 0s`, `animationName: none`, text `"In 10d 18h 44m"`; `countdownTick.intervalMs: 30000`. Space is pre-reserved (`min-height: 39px`), so there is no CLS excuse for the hard pop. | Align to the minute boundary, then 60 s interval; fade in once over `--dur-ui`; crossfade the minute field on change. See §2 for the larger version of this. |
| **F8** | P2 | `global.css:599-607` | The reduced-motion `transition-property` clamp leaves each element's `transition-duration` list intact, so CSS cycles the shorter list and durations land on the wrong properties site-wide. | `hero-measurements.json` `reducedMotion`: `.btn` property list is 6 long (`opacity, color, background-color, border-color, fill, stroke`), duration list 4 long (`0.12s, 0.18s, 0.18s, 0.18s`) → `opacity` inherits the 120 ms press duration. On `.garage-btn` the hover border-color falls from 180 ms to 120 ms under reduced motion. | Add `transition-duration: var(--dur-hover) !important;` to the same universal rule. |
| **F9** | P2 | `GarageSlide.astro:65-69`, `about.astro:235-239` | A 3 % hover zoom promises a click on figures that are not links — the exact behaviour `ResultsTable.astro:223` and `DESIGN.md:26` rule out. | `interact-measurements.json` `garage.slideIsLink: false`, `frames-measurements.json` `about.shotIsLink: false`; `slideHover.transform: matrix(1.03,…)`. `d-garage-slide-hover.png`, `d-about-shot-hover.png`. | Make the frame open the full render (or link the car to its results), or delete the zoom. Do not keep a rule the site elsewhere forbids. |
| **F10** | P2 | `Garage.astro:122-125` | The disabled arrow at `opacity: 0.3` composites to ≈2.5:1 on `--bg` and reads as absent rather than unavailable, defeating the `visibility` handling two rules above that deliberately keeps its footprint. | Measured `opacity: "0.3"` at both ends of the track (`garage.prevRest`, `garage.atEnd.nextOpacity`). `#ebfffb` at 0.3α over `#000a08` → contrast 2.52:1. `d-garage-arrows-disabled-prev.png`, `d-garage-arrows-disabled-next.png`. Disabled controls are WCAG-exempt, so this is craft, not compliance. | `opacity: 0.45` on the icon; keep the border at full `--line`. |
| **F11** | P2 | `site.ts:237-259` | `progress.style.width` — a layout-driving property — is written from inside the rAF scroll update, every frame, to a value that never changes during a scroll. | `garage-measurements.json` `progressWrites`: `distinctWidthValues: ["50.776%"]`, `widthIsConstantDuringScroll: true`. Measured cost today is nil (Blink short-circuits identical values); the shape is the one emil Standard 7 names. | Set `width` from the resize path only; keep `transform` in the scroll path. |
| **F12** | P2 | `DriverCard.astro:128-142`, `:144-153`, `:171-179` | One hover drives three properties on three different clocks: number fill eases over 240 ms, its `-webkit-text-stroke-color` snaps (absent from the transition list), the name colour snaps (`transition-property: all / 0s`). | `interact-measurements.json` at +90 ms: `driverCard.hover90.color` `rgba(15,255,207,0.92)`, `webkitTextStrokeColor` `rgb(15,255,207)`, `driverCardName.hover90.color` `rgb(15,255,207)` with `transitionDuration: "0s"`. `d-driver-hover-90ms.png`. | One duration for the set — `var(--dur-hover)` on the fill, the stroke colour and the name. |
| **F13** | P2 | `404.astro` | The 404 has no motion of any kind, on a site where every other page opens with the `[data-enter]` grammar. | `interact-measurements.json` `notFound`: `hasEnter: 0`, `animations: []`. Compare home 6 animations, `/partners` 5 `[data-enter]`, `/about` 3. `d-404-rest.png`. | `<h1 data-enter>`, lead at `--enter-delay: 60ms`, actions at `120ms`. `delight.md` puts the error page in the row where personality is most welcome. |
| **F14** | P2 | `index.astro:78-100`, `ResultsTable.astro:30-64` | The results module — the brief's social proof — has no entrance, while the decorative pillar band and the join explainer do. The motion budget is inverted. | `interact-measurements.json` `reveals`: 7 on `/`, all of them `pillar reveal` (4) + join steps (3); `results.focusable.rowsHaveReveal: 0`. | `<tr class="reveal" style={\`--reveal-delay: ${i * 45}ms\`}>`, capped at the 6 rendered rows (225 ms total). Consistent with pass 2 C8, which kept `.reveal` on genuine sibling lists and only removed it from wrappers. |
| **F15** | P2 | `Base.astro:104-112`, `site.ts:54-64` | The sticky-header state flips at ~2 px of scroll (1 px sentinel, `threshold: 0`) and crossfades for 240 ms each way — a hair trigger on a quarter-second animation. | `interact-measurements.json` `navStuck`: transparent at scrollY 0; at scrollY 4 the background is already mid-transition (`rgba(0,10,8,0.894)` at +90 ms) and opaque by +400 ms. | `height: 64px` on `[data-nav-sentinel]`, or `rootMargin: '-64px 0px 0px 0px'` on the observer. |
| **F16** | P2 | `global.css:410-421` vs `Nav.astro:42`, `:78`, `Footer.astro:37`, `Hero.astro:78` | Five link families carry the same arrow icon; exactly one nudges it on hover. | `interact-measurements.json` `textLinkSvg`: rest `none` → hover `matrix(1,0,0,1,3,0)` over 180 ms. No `svg` transition or hover transform exists on `.btn`, `.footer-col a`, `.mobile-links a`, `.nav-cta`. | Extend the nudge to every arrow-carrying link, or drop it from `.text-link`. Either is right; the 1-in-5 split is not. |

---

## 4. Do not change

1. **`ResultsTable.astro:223-224` — no row hover.** The comment ("a background change promises a click
   that does not exist") is the correct call and the measurement backs it: six rows, zero tabbable
   children, byte-identical computed style at rest and on hover. Keep the comment as well as the rule —
   it is the reason nobody re-adds it. (F9 asks the garage to live up to this, not the reverse.)
2. **`global.css:484-505` — the skip link is deliberately not animated.** emil Standard 2, verbatim:
   never animate a keyboard-initiated action. Pass 2 C13 fixed this; the resting `translateY(-120%)`
   with no transition is exactly right.
3. **`Hero.astro:247-267` — the scroll-driven parallax, written as longhands.** Measured −14.85 px at
   scrollY 0 → +34.65 px at 900 on a real `ScrollTimeline` (off the main thread, no scroll listener),
   `@supports`-gated, absent under reduced motion, and the longhand form exists specifically because the
   minifier destroys the shorthand. This is the best-engineered motion on the site. Do not "tidy" it
   back into `animation:`.
4. **`global.css:526-534` + `site.ts:21-51` — the `.reveal` contract.** 12 px of transform, never
   opacity, gated behind `html.js`, unobserved after firing, and a 1500 ms timer that settles
   stragglers. Measured 7/7 settled after a real scroll at 390 px. This is what makes "nothing is
   invisible without JS" true rather than aspirational. Do not convert it to a fade — F14 adds rows to
   this system, it does not change its mechanics.
5. **`global.css:551-556` / `575-582` — `enter-media` with no `opacity`.** Pass 2 measured +2260 ms of
   LCP from fading this image. The comment explaining why is load-bearing. Never re-add opacity to the
   LCP element's entrance.

Honourable mention, also worth protecting: `site.ts:166-188` applies smooth scrolling **per click**
instead of globally, so a cross-page anchor (`/partners → /#results`) jumps instead of flying across
several thousand pixels. That is a subtle, correct decision most sites get wrong.

---

## 5. Artefacts

- `<scratchpad>\shots\r3-motion\` — ~90 frames.
  - `f-hero-*.png`, `f-hero-copy-*.png`, `f-m-hero-*.png` — **exact** frozen entrance frames at 0 / 150 / 300 / 600 / 900 ms, desktop and mobile.
  - `d-hero-parallax-y*.png` — parallax at five scroll positions.
  - `d-nav-*`, `d-navcta-*`, `d-herocta-*`, `d-focus-tab-1..6` — hover / press / focus states and the keyboard walk.
  - `d-garage-*` — arrows at rest, hover, press, both disabled ends, slide hover, viewport focus, and four stepped presses.
  - `d-driver-hover-90ms / 250ms / settled`, `d-driver-press`, `d-driver-focus`.
  - `d-results-*`, `d-countdown`, `d-footer-*`, `d-textlink-*`, `d-team-*`, `d-about-shot-hover`, `d-404-*`.
  - `m-menu-open-f0..f5`, `m-menu-close-f0..f4`, `f-menu-icon-*`, `m-garage-*`, `m-404-rest`.
- Measurements: `hero-measurements.json`, `interact-measurements.json`, `mobile-measurements.json`,
  `garage-measurements.json`, `frames-measurements.json`.
- Scripts: `<scratchpad>\motion-tool\{lib,hero,interact,mobile,garage,frames}.mjs`.

Two notes for whoever picks this up. First, `d-hero-enter-*.png` (the first run) are ~120 ms late — the
CSS `animation-play-state: paused` freeze does not hold in Chrome; use `f-hero-*.png`. Second, any
press test that clicks a real anchor navigates and invalidates everything after it; both interaction
scripts install a capture-phase `preventDefault` on `a` for that reason.
