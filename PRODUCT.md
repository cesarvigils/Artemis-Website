# PRODUCT.md - Artemis Esports

Project context for anyone (human or agent) working on this site.
Companion file: `DESIGN.md` (the visual system). Content editing: `CONTENT.md`.

## What this is

The marketing site for **Artemis Esports**, an iRacing endurance / GT and NASCAR
oval team. Four pages plus a 404, static, no CMS, no backend. Built with Astro,
deployed as plain files to a cPanel/LiteSpeed host.

Register: **brand** (design IS the product). A visitor's impression is the thing
being made. It is not app UI.

## Who it is for, in priority order

1. **Sim racers deciding whether to apply.** The only real growth lever. They need
   to know: is this team real, who is on it, what does it race, what has it done,
   how do I join.
2. **Sponsors doing a 60-second check.** They need results, roster, liveries (where
   a logo would go), the channels, and a contact.
3. **Fans** who come back for results and the next race.

## Definition of success

A visitor understands in five seconds that Artemis is an active iRacing team with
real results, has a reason to scroll (results, cars, roster, next race) and a
reason to come back (results and calendar freshness).

Failure looks like a beautiful page of slogans.

## Primary action per page

One primary CTA per page, at most one quieter secondary action.

| Page | Primary | Secondary |
|---|---|---|
| `/` | Join the team (Discord) | See results (in-page anchor) |
| `/team` | Join the team (Discord) | - |
| `/about` | Join the team (Discord) | - |
| `/partners` | Partner with us (mailto) | All results / Full roster links |
| `404` | Back to the paddock | See results |

The header button carries the **page's own** primary action. That is
"Join the team" everywhere except `/partners`, where it is the same mailto as
the page head and the contact card. One label per intent, used everywhere on
that page: a sponsor never sees two different words for the same next step.
`src/data/nav.json` holds the override and `src/lib/links.ts` the two intents.

## Information architecture

Flat. Four pages, no sub-navigation, no new top-level pages.

```
/            Hero -> Next race -> Results -> Garage -> Drivers -> How we race -> Partners -> Join
/team        Entry list -> Roster grouped road / oval / pitwall -> Race with us
/about       Origin + photos -> Values (with the hashtags) -> How to join
/partners    Dossier + contact -> What a partner gets -> Results + who runs them
             -> Channels -> Current partners -> Contact
404          Branded, links home + results + the three pages
```

Results are reachable from every page: the header nav and the footer both point
at `/#results`.

Results and the next race are **home-page modules**, not pages: the content volume
of one small team's calendar does not justify the extra depth, and results are the
credibility asset, so they must be readable without a click.

## Content model

Everything editable lives in `src/data/*.json`. See `CONTENT.md` for how to edit
it and the list of records that are still placeholders.

Three of those files are **owned by the Artemis Data Bot**, which writes them
from Discord straight to the deploy branch. Their shape is fixed by
`docs/data-contract.md`, which the bot and the site implement identically; any
change to it applies to both. `npm run check:data` validates them and runs as
`prebuild`, so a bad write fails the build instead of deploying a broken page.

| File | Holds | Written by |
|---|---|---|
| `results.json` | Race results: position, field size, series, class, drivers | The bot (`/result`) |
| `drivers.json` | Roster, grouped `road` / `oval` / `crew`, with `active` and optional stats | The bot (`/driver`) |
| `events.json` | Calendar, with `status` per entry | The bot (`/event`) |
| `site.json` | Name, tagline, hero lead, mission, founding dates, contact, socials, store, hashtags, pillars, join steps | By hand |
| `nav.json` | The single source of truth for nav links, the CTA intent and its per-path override | By hand |
| `cars.json` | Captions for the five garage slides | By hand |
| `partners.json` | Partner name, logo file, link, blurb | By hand |

Sorting and selection live in `src/lib/data.ts`. No page assumes a file arrived
in order, because a human edit can always break it.

## Constraints

- **Static forever.** No server, no forms that POST, no analytics backend.
- **Fonts:** Nexa Bold (700) and Nexa Light (300) are the only licensed weights on
  disk. JetBrains Mono carries data. Nothing else may be added.
- **No invented metrics.** No follower counts, no iRating figures, no sponsor names
  that are not confirmed. If a number is not known, the site says where to ask.
- **No stock or AI imagery.** Only the team's own in-sim renders and photos.
- **No scroll-jacking, no pinned sections.** See `DESIGN.md` for the motion rules.

## Open decisions for the owner

1. Replace the placeholder roster and results with the real ones. This is now a
   Discord job: `/driver`, `/result`, `/event`. See `CONTENT.md`, "Fill in".
2. Driver headshots do not exist yet. The roster is typographic until they do.
3. No photograph on the site shows a rig, a wheel or a screen with a car on it.
   Every picture is from the gaming side of the org and is captioned as such.
   One real photo of the sim setup would do more for `/about` than any edit.
4. Confirm the About origin copy; it is a first draft written from the two known
   facts (founded 2017, iRacing since 2023).
5. Driver `stats` (iRating, licence) render the moment they are filled in and
   stay invisible until then. Nothing is invented to fill the slot.
6. **A dark-variant GLYTCH mark.** `src/assets/partners/glytch-white.png` is
   white on transparent, so on any light ground it is invisible - including
   Windows High Contrast, which is the mode a partner's accessibility-audited
   machine may be running. The site now puts the mark on an opaque plate in
   that mode so the one piece of sponsor evidence survives, but the right fix
   is a dark-on-transparent export from GLYTCH. Ask for one.
7. **The Nordschleife render is a 1089px crop** of a 1919px original, made to
   remove two AMG hoardings. It is the one garage photo that cannot serve a
   retina tablet at full sharpness. A clean re-render at 1920 without the
   hoardings in frame would close that.

**Closed:** the hero render carried a NordVPN decal while the Partners page said
GLYTCH was the only partner. The hero is now the Interlagos LMP2, which carries
no third-party mark, and the Porsche is out of the garage as well.
