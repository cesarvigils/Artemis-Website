# PRODUCT.md - Artemis

Project context for anyone (human or agent) working on this site.
Companion files: `docs/brand-core.md` (the brand this serves and the authority
over every naming, colour, type and voice question), `DESIGN.md` (the visual
system), `CONTENT.md` (content editing).

## What this is

The marketing site for **Artemis**, an iRacing endurance / GT and NASCAR oval
team. Five pages plus a 404, static, no CMS, no backend. Built with Astro,
deployed by Vercel from the repository. Plus one generated page per driver
under `/team/<id>`, which the roster links to and the sitemap tracks.

**The team is "Artemis."** One roster means the org name is the team name
(brand core, section 5). "Artemis Esports" is the org, and it appears only where
the org itself is named: the wordmark, the `<title>`, the structured data and
the copyright line. Body copy says Artemis. "Artemis iRacing" does not exist
until there is a second roster.

**The promise is "Every shot on the record."** It is the tagline everywhere -
footer, `site.json`, meta descriptions, the OG card, the JSON-LD slogan. The
motto, "Take the shot.", appears once: the home join band.

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
| `/` | Join the Discord | See the Scoreboard (in-page anchor) |
| `/team` | Join the Discord | - |
| `/team/<driver>` | Join the Discord | "The Scoreboard" to the home results module |
| `/standings` | Join the Discord | The league's own table, when a season is published |
| `/join` | Apply in the Discord | - |
| `/about` | Join the Discord | - |
| `/partners` | Partner with us (mailto) | "The Scoreboard" to the home results module |
| `404` | Back to home | See the Scoreboard |

**One label per intent, per audience.** `src/lib/links.ts` holds three:
"Join the Discord" is the driver action everywhere but `/join`; "Apply in the
Discord" is the same address worded for the one page where the reader has
already decided; "Partner with us" is the partnership mailto. Pass 5's
"See results" / "All results" pair is gone: the destination is called **the
Scoreboard** wherever it is linked.

The header button carries the **page's own** primary action, and on a phone the
sticky bottom bar carries the same one. Only one of the two is on screen at a
time: the compact header button hides while the bar is up, because two
Signal-filled buttons in one 390px viewport spend the colour budget twice on one
intent. `src/data/nav.json` holds the per-path override and `src/lib/links.ts`
the three intents.

**The audience router** sits directly under the next-race strip on the home
page: three plain text links, one line each, for the three audiences above.
"Follow the team" to the Scoreboard, "Race for us" to `/join`, "Partner with
us" to `/partners`. It is the first moment a visitor has seen enough to know
which of the three they are.

## Information architecture

Flat. Five pages, no sub-navigation, no further top-level pages.

```
/            Hero -> Next race -> Audience router -> The Scoreboard -> Garage
             -> Who drives -> What we stand for -> Partners -> Join
/team        Entry list -> Roster grouped road / oval / pitwall -> Race with us
/join        Open seats -> What a season asks of you -> How to apply
/about       Origin + photos -> What we stand for (long) -> How to join
/partners    Dossier + contact -> What a partner gets -> Recent results + who runs
             them -> Channels -> Current partners -> Contact
404          Branded, links home + the Scoreboard + the pages
```

Nav is **Scoreboard / Team / Join / Partners** plus the CTA. `/about` moved to
the footer only: it is the page a visitor reads last, if at all, and the header
had no room for a fifth label beside a button.

The Scoreboard is reachable from every page: the header nav and the footer both
point at `/#scoreboard`.

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
| `site.json` | Name, team name, tagline, motto, hero lead, mission, founding dates, contact, socials, store, the three commitments, the join steps and the join expectations | By hand |
| `seats.json` | The open (and filled) seats on `/join`: program, role, requirements, status, note | By hand |
| `stats.json` | iRating, safety rating and the newest official races per driver | The nightly iRacing sync. Optional in every direction: no file, no entry and no category all render nothing |
| `nav.json` | The single source of truth for nav links, the CTA intent and its per-path override | By hand |
| `cars.json` | Captions for the five garage slides | By hand |
| `partners.json` | Partner name, logo file, link, blurb | By hand |

Sorting and selection live in `src/lib/data.ts`. No page assumes a file arrived
in order, because a human edit can always break it.

## Constraints

- **Static forever.** No server, no forms that POST, no analytics backend of our
  own. The one third-party script is Umami Cloud, it is cookieless, and it ships
  only when `PUBLIC_UMAMI_WEBSITE_ID` is set at build time.
- **Fonts:** Archivo (display) and Inter (body, UI, numbers), both variable, both
  self-hosted and subset. Nothing else may be added. See `DESIGN.md` §3.
- **The Signal budget.** `#0FFFCF` is capped at 5-10% of any screen and has five
  allowed jobs. Adding a sixth is a change to `docs/brand-core.md`, not to a
  component.
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
5. **Decide whether iRating and licence class go on the site at all.** The
   `stats` slot renders the moment it is filled in and stays invisible until
   then, and nothing is invented to fill it. This is not a missing task: it is
   public information about individual people, and a driver who is having a bad
   season has their rating published beside their name. Either the team wants
   that on the roster or it does not.
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

8. **Is NordVPN a current partner?** The Daytona Porsche render carries a
   legible NordVPN door decal, and it is the best-lit shot in the set. It is out
   of the site entirely because the Partners page says GLYTCH is the only
   partner and the two cannot both be true on one page. A yes puts the render
   back and adds a record to `partners.json`; a no keeps it out. Nobody has
   asked.

9. **The Arc.** The brand core's one recurring graphic device - a crescent whose
   inner edge sharpens into an arrowhead, derived from the notched A - is not on
   the site. It needs to be drawn by the designer who owns the identity, at one
   weight, as a vector; inventing one here would put a second, wrong version of
   a brand asset into circulation. Deferred deliberately.
10. **Confirm the `/join` placeholders.** Both seats in `src/data/seats.json`
    are marked `_placeholder` and so are the four expectations in
    `site.json`: the rating floors, the stint length, which league night, the
    practice cadence and the minimum age of 16 are all plausible rather than
    agreed. A driver will read them as a commitment.
11. **Umami.** Analytics are wired and switched off. Turning them on is two
    environment variables on the Vercel project; see `DEPLOY.md`. Until then
    the footer says "We run no analytics and set no cookies", which is true.

**Closed:** the results link's two labels ("See results" on the home page and
the 404, "All results" on `/partners`) are now one, "the Scoreboard".

**Closed:** the hero render carried a NordVPN decal while the Partners page said
GLYTCH was the only partner. The hero is now the Interlagos LMP2, which carries
no third-party mark, and the Porsche is out of the garage as well. The question
of whether NordVPN should be listed is open above.
