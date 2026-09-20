# Working in this repository

Astro basics (dev server, routing, components) are in `AGENTS.md`.
Everything below is about not wrecking a design system that is already good.

## The authorities, in order

Read the one that governs before changing anything it governs. They do not
repeat each other, and when they disagree the higher one wins.

1. **`docs/brand-core.md`**: the brand. Positioning, promise, voice, the
   colour budget, the logo size rules. Its closing table maps every rule to
   the file that carries it; that table is the fastest drift check there is.
   It says so itself: when it and a generic design rule disagree, it wins.
2. **`DESIGN.md`**: how the brand is expressed in this codebase. Section 0
   records every place a local decision overrules a general rule, and
   **section 1 lists what is deliberately absent.** Read that list before
   adding a layout, not after.
3. **`CONTENT.md`** and **`docs/data-contract.md`**: what the words are and
   what the bot may write.
4. Generic design advice, including anything pasted into a prompt. Last.

**Imported anti-slop advice that contradicts the brand core is wrong here.**
Every public ban list names Inter; this brand specifies Inter as the body and
data face, with tabular numerals, by name. Same for the dark ground and the
single saturated accent. A rule that was written about the median SaaS page
does not get to overrule a document written about this team.

## Before you add or change a layout

- `DESIGN.md` section 1 forbids **equal card grids** and sets **no layout
  family twice on a page.** The home page violated this four times and it is
  the single reason the site read as templated. Count the compositions before
  adding one.
- Numbers labelling a sequence are allowed in exactly one place, the three
  step Join explainer, because it genuinely is a sequence. Not elsewhere.
- Uppercase + tracked + `--text-2xs` is the vocabulary for **labelling a
  value**: a column head, a data cell's name. It is not a decoration and not
  a navigation style. Nineteen files under `src/components` and `src/pages`
  already carry it; do not add the twentieth without a value to label.

## Before you write copy

The voice is `docs/brand-core.md` section 7: a driver on the radio after a
stint. **Lead with the fact and stop.**

- **Never write to a character count.** Title and description length advice
  is a rough guide, not a target; padding to reach 150 characters is how copy
  stops sounding like a person. A short honest line beats a padded one, and
  length has never been a ranking input.
- A page title should be the heading the page actually shows.
- Never write a sentence about the team's own restraint. "An invented table
  would be worse than none" is the same move as "we build in silence"; the
  brand core lists that exact construction in its don't-say column.
- No em dashes anywhere in this repository. No emoji, no exclamation marks.

## Before you use a token

**Verify the custom property exists.** `var(--ease)` is not a token here; the
real ones are `--ease-out-quart` and `--ease-out-expo`. An undefined custom
property invalidates the whole declaration, so a transition referencing one
silently never runs. It ships looking fine and does nothing.

- `--muted-deep` is for large decorative type, disabled states and the 404
  mark. It is 4.4:1 and never carries text at body size.
- `--weight-small` (600) is the floor at `--text-xs` or below. Light type on
  this ground reads lighter than it is.
- Signal has an allowed-use list in the brand core's applied table. Hover
  steps are on it; new resting areas of Signal are not.
- `--night-rgb` must be updated by hand whenever `--night` changes.

## Before you claim something passes

- **Measure, don't eyeball.** "Four equal 3-up grids" came from reading
  computed column widths out of the rendered page. A screenshot alone misses
  spacing, weight and alignment; pair it with computed styles.
- **Watch for state the check depends on.** Two checks passed locally and
  failed in CI this way: one read `dist/` before anything built it, another
  typechecked specs whose `@playwright/test` types live in
  `tests/node_modules`. If a check can pass because of what the last command
  left behind, it is not a check. Delete the artefact and run it again.
- `npm run check:types` typechecks everything, installs its own tooling, and
  is what CI runs. `astro build` does not typecheck.
- The placeholder rule is load-bearing. Nineteen records carry
  `_placeholder` today: every driver (8), event (3), result (6) and seat (2).
  `partners.json` and `cars.json` are real. Nothing flagged may reach the
  index, the sitemap, the structured data or the feed, and
  `npm run test:seo --prefix tests` proves it, including by promoting a
  record to exercise the path that is switched off. Publishing is deleting
  the flag, never editing code.

## On "AI slop"

The useful part of the diagnosis is not the list of tells, which moves as
models move. It is this: **the root cause is no decision.** Undifferentiated
output signals that nobody chose anything.

- A single tell means little; a cluster is the signal. Do not rewrite
  something sound because one line pattern-matches.
- When a section is weak, **regenerate it from a decision** rather than
  re-prompting for "better". Asking the same question again samples the same
  distribution and returns a rearrangement of the same tells.
- Critique adversarially or not at all. "Name the ten most damaging problems,
  ranked, compliment nothing" gets a real answer; "how is this?" gets praise.
- This site's strongest asset is the pit-wall vocabulary: the timing-tower
  rows, tabular numerals, position markers, hairlines. When something needs
  shape, reach for that before inventing a new one.
