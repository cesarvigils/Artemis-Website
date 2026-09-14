# Pass 2 fixer brief (orchestrator)

Two jobs in one pass, in this order: (1) implement the data contract on the website; (2) apply the pass-2 critiques.

## 1. Data contract integration (binding: `data-contract.md`)

- Convert `src/data/results.json`, `drivers.json`, `events.json` to the contract shape: add stable `id`s (generated per the contract's default rules), `drivers` as string arrays, `country` as ISO alpha-3, `group`/`role`/`active`, event `status`, etc. Keep every existing placeholder record and its `_placeholder: true`.
- Rendering rules per the contract's "Site usage" lines: home results = first 6 after sorting; hero proof row = lowest `position` among the newest 3; "Who drives" = first 4 active drivers; team page = active drivers grouped road / oval / crew; next race = first future `planned`/`confirmed` event, with the "No race scheduled" fallback; `stats` and `socials` render only when present. Sorting is done in a tiny `src/lib/data.ts` (readers never assume the file is sorted).
- `scripts/check-data.mjs`: validates the three files against the contract (types, enums, ranges, patterns, unique ids, date sanity) and prints `file[index].field: message` lines; exit 1 on any error. Add `"check:data": "node scripts/check-data.mjs"` and `"prebuild": "npm run check:data"` to `package.json`. Vercel runs `npm run build`, so a bad write fails the build and the previous deployment stays live.
- Copy `data-contract.md` into the repo as `docs/data-contract.md` (the bot branch carries its own copy; they must stay identical).
- `CONTENT.md`: replace the JSON how-tos with "results, drivers and events are managed through the Discord bot (`/result`, `/driver`, `/event`, Manage Server permission); hand edits are allowed but must pass `npm run check:data`". Keep the hero/garage/partners/nav how-tos.

## 2. Orchestrator-verified observations (fix these regardless of critique ranking)

- Mobile, home, scroll step 1 (`shots\r1b\mobile-home-scroll-01.png`): the Results table body is invisible below its heading because reveal visibility depends on IntersectionObserver with `threshold: 0.15` and a negative bottom root margin. Content must never be blank: reveal only as an enhancement on already-visible content (e.g. `opacity` starts at 1 and the animation runs from a transform-only keyframe, or observe with `threshold: 0` and `rootMargin: 0px 0px 10% 0px`, plus a 1.5 s safety that adds `.in-view` to everything still pending). Also the reduced-motion block must never leave `opacity: 0`.
- Same capture: the nav is still transparent after scrolling past the hero, so the hero's ghost "See results" button shows through the bar. The nav must be solid as soon as the hero's top leaves the viewport (sentinel placed at the hero top, not bottom; or a scroll-position class), on mobile as well.

## 3. Critique triage rules

- Read all three critiques (`pass2-critique-A.md`, `-B.md`, `-C.md`). Merge duplicates. Fix every P0 and P1. Fix P2s that cost under ~15 minutes each and do not conflict with the brief; list the rest as "deferred" with a one-line reason in the report.
- Where critiques conflict, the brief (`design-brief.md` §1–§6) wins; where two critiques conflict with each other, prefer the one citing a rule from the skill references, and say which you chose.
- Do not reintroduce anything the "Do not change" lists protect: the results sheet, `--radius: 0` + hairlines, the two-weight hero lockup, the native scroll-snap garage, the refusal to invent metrics, the flat IA, the single primary CTA per page.
- Photos: you cannot add new imagery. Where a critique objects to a photo's subject (LAN crowd, non-iRacing game), the fix is composition and captioning (or dropping that photo and using an in-sim render from `src/assets/racing/`), not new assets. The NordVPN hero decal is an owner decision: keep the render, but note it in the report.
- Copy: keep sentence case, no exclamation marks, plain words; replace jargon a newcomer would not know ("paddock" is fine in a racing context; keep it unless the critique's point is stronger).

## 4. Verification (required)

`npm run build` exit 0 (with `check:data` passing) → `node <scratchpad>\shots-tool\shot.mjs --dist D:\Artemis\Website\Website\dist --out <scratchpad>\shots\r2` → view every desktop full/hero and mobile full plus the mobile scroll steps 01–04 for home → fix → repeat until clean. Confirm in the r2 captures that the two orchestrator-verified bugs are gone. Write `<scratchpad>\pass2-report.md`: per critique ID what was done (fixed / deferred + reason), the data-contract changes, build and dist numbers, and the 5 things you are least sure about. Do not commit.
