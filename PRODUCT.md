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
| `404` | Back to the paddock | Join the team |

The nav button is site-wide chrome and always says **Join the team**. Label per
intent is fixed: one "join" label, one "partner" label, nowhere else.

## Information architecture

Flat. Four pages, no sub-navigation, no new top-level pages.

```
/            Hero -> Next race -> Results -> Garage -> Drivers -> How we race -> Partners -> Join
/team        Roster grouped road / oval / pitwall, then Race with us
/about       Origin -> Photos -> Values -> Hashtags -> How to join
/partners    What a partner gets -> Results -> Roster -> Channels -> Current partners -> Contact
404          Branded, links home + Discord + the three pages
```

Results and the next race are **home-page modules**, not pages: the content volume
of one small team's calendar does not justify the extra depth, and results are the
credibility asset, so they must be readable without a click.

## Content model

Everything editable lives in `src/data/*.json`. See `CONTENT.md` for the schemas
and the list of records that are still placeholders.

| File | Holds |
|---|---|
| `site.json` | Name, tagline, hero lead, mission, founding dates, contact, socials, store, hashtags, pillars, join steps |
| `nav.json` | The single source of truth for nav links, the CTA and footer links |
| `results.json` | Race results (newest first is not required; the site sorts) |
| `events.json` | Calendar; the first entry not yet finished becomes "Next race" |
| `drivers.json` | Roster, grouped `road` / `oval` / `crew` |
| `cars.json` | Captions for the six garage slides |
| `partners.json` | Partner name, logo file, link, blurb |

## Constraints

- **Static forever.** No server, no forms that POST, no analytics backend.
- **Fonts:** Nexa Bold (700) and Nexa Light (300) are the only licensed weights on
  disk. JetBrains Mono carries data. Nothing else may be added.
- **No invented metrics.** No follower counts, no iRating figures, no sponsor names
  that are not confirmed. If a number is not known, the site says where to ask.
- **No stock or AI imagery.** Only the team's own in-sim renders and photos.
- **No scroll-jacking, no pinned sections.** See `DESIGN.md` for the motion rules.

## Open decisions for the owner

1. Replace the placeholder roster and results with the real ones (`CONTENT.md`,
   "Fill in").
2. Driver headshots do not exist yet. The roster is typographic until they do.
3. The hero render carries a NordVPN decal on the car. If that partnership is not
   current, swap the hero image.
4. Confirm the About origin copy; it is a first draft written from the two known
   facts (founded 2017, iRacing since 2023).
