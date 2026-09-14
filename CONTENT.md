# Updating the site

Two ways in:

- **Results, drivers and events** are managed from Discord by the Artemis Data
  Bot. You do not touch the files.
- **Everything else** (hero photo, garage, partners, navigation, copy) is a
  small edit in `src/data/` or one line in a component, described below.

Either way, after a change:

```
npm run build
```

The build runs `npm run check:data` first. If any of the three bot-owned files
breaks the contract the build stops with a list of `file[index].field: message`
lines and nothing is deployed, so the previous version stays live.

---

## Fill in

These records are **placeholders**. They are realistic, but they are not real.
Every one carries `"_placeholder": true` in the JSON (never rendered; the bot
shows `(placeholder)` beside them so you can spot them). Replace them and drop
the flag.

| Where | What is fake | How to replace |
|---|---|---|
| `src/data/drivers.json` | All 8 entries: names, countries, car numbers, focus lines and bios | `/driver edit` in Discord, or edit the file. Keep `group` as `road`, `oval` or `crew`. |
| `src/data/drivers.json` -> `stats` | Not present on anyone | Optional. `irating` is a whole number, `licence` looks like `A 4.20`. Nothing renders until you add them. |
| `src/data/drivers.json` -> `socials` | Not present on anyone | Optional. Keys are `x`, `twitch`, `youtube`, `instagram`; https URLs only. |
| `src/data/results.json` | All 6 results: finishing positions, field sizes, driver names, note lines | The **events, tracks and dates are real** and can stay. Replace `position`, `entries`, `drivers` and `note` with what actually happened. |
| `src/data/events.json` | All 3 entries | Petit Le Mans at Road Atlanta (25-27 Sep 2026) is real. The two league rounds after it are invented. |
| `src/pages/about.astro` | The two paragraphs under "Where this came from" | Draft copy written from the two facts we had (founded 2017, iRacing since 2023). Rewrite in your own words. |

**Not placeholders, already correct:** the tagline, mission, the four pillars
and their detail lines, the hashtags, the contact email, every social and store
URL, the Discord invite, the GLYTCH Energy partner entry, and all five garage
renders.

---

## Results, drivers and events (the Discord bot)

`src/data/results.json`, `drivers.json` and `events.json` are written by the
Artemis Data Bot. Anyone with **Manage Server** in the Discord can run:

- `/result` - add, edit or remove a race result
- `/driver` - add, edit or remove a roster entry
- `/event` - add, edit or remove a calendar entry

The bot commits one change at a time straight to the deploy branch, the host
rebuilds, and the change is live in about a minute. It replies with what
changed and the commit it made.

**Hand edits are still allowed.** The bot re-reads the file before every write,
so it will not overwrite your change. If you edit by hand, the rules in
`docs/data-contract.md` apply exactly as they do to the bot, and
`npm run check:data` has to pass before the site will build. The short version:

- `id` is a lowercase slug, unique in its file, and never edited. To change an
  id, remove the record and add it again.
- Dates are `YYYY-MM-DD`. No times.
- `results.json`: `class` must be one of GTP, LMP2, GT3, GT4, TCR, NASCAR Cup,
  NASCAR Xfinity, NASCAR Trucks, ARCA, Formula, Other. `position` is 1-99.
  `entries` is the field size and is optional; when it is there the site prints
  `P2 / of 41`, when it is not it prints `P2` and says nothing more.
  `drivers` is a list of names, and each name has to match a `name` in
  `drivers.json` for that driver's "Last drive" line to appear on the Team page.
- `drivers.json`: `role` is `driver`, `pitwall` or `staff`; `group` is `road`,
  `oval` or `crew`; `country` is a three-letter code (`USA`, `GBR`, `BRA`).
  `active: false` hides someone from the site without deleting their record.
- `events.json`: `status` is `planned`, `confirmed`, `done` or `skipped`. The
  "Next race" strip shows the first `planned` or `confirmed` entry that has not
  finished, and lists the ones after it underneath. With none left it says
  "No race scheduled".

Where each file shows up:

| File | On the site |
|---|---|
| `results.json` | Home "Recent results" (first 6), the hero proof line (best finish among the newest three), the Partners dossier and its snapshot (first 3), each driver's "Last drive" line |
| `drivers.json` | Home "Who drives" (first 4 active drivers), the whole Team page, the Partners entry-list line |
| `events.json` | Home "Next race" strip and the entries listed under it |

`docs/data-contract.md` is the full specification and is kept identical to the
copy the bot uses. If it changes, both sides change together.

---

## Change the garage photos

The garage has **five fixed slots**. Changing a caption is a data edit; changing
a photo is a two-line code edit (deliberate, see DESIGN.md section 8 - it is
what keeps the build from shipping 70 MB of full-size originals).

**To change a caption only**, edit `src/data/cars.json`:

```json
{
  "image": "sebring-mustang-gt3.jpg",
  "car": "Ford Mustang GT3",
  "track": "Sebring",
  "caption": "Golden hour on the way to turn one.",
  "shape": "portrait"
}
```

`shape` is `portrait`, `standard` or `wide` and sets how wide that slide sits in
the filmstrip. It does not crop the photo; it chooses the frame.

**To swap a photo:**

1. Put the new file in `src/assets/racing/` (JPG, no wider or taller than 1280px
   on its long edge; the build makes the webp versions).
2. In `src/components/Garage.astro`, change the matching `import` line at the top
   to the new filename, and change the matching `<Image src={...}>` below it to
   the new import name.
3. Update the same row in `cars.json` (`image`, `car`, `track`, `caption`, `shape`).

**Check the render for other people's logos.** The Daytona Porsche shot is out
of rotation because a NordVPN door decal is legible at slide size and we do not
list NordVPN as a partner. The Nordschleife shot is in rotation as a crop,
because the original frame is dominated by two trackside AMG hoardings.

## Change the hero photo

1. Put the new render in `src/assets/racing/` (up to 1920px on the long edge).
2. In `src/pages/index.astro`, change the `import heroSource from ...` line.
3. Change the `alt` text on the `<Hero ... alt="..." />` line just below it to
   describe the new shot.
4. Look at it at 1440 and at 390 before shipping. The first screen must not show
   a logo belonging to anyone who is not on the Partners page, and the car has to
   be recognisable at phone width. `src/components/Hero.astro` has an
   `object-position` and a `--media-zoom` in its `max-width: 900px` block for
   exactly that.

## Change the About photos

The three photos are imported at the top of `src/pages/about.astro`. Drop new
files in `src/assets/photos/`, change the import paths, and update each `alt`
**and its `<figcaption>`**. The captions exist because the pictures are from the
gaming side of the org, not the race team, and they sit in the origin story for
that reason. Sizes: the wide one is used at up to 1920px, the other two at up to
1280px.

## Add a partner

1. Put a transparent logo (the white version reads best) in `src/assets/partners/`.
2. In `src/components/PartnerBand.astro`, add an `import` for it and an entry in
   the `partnerLogos` map just below the imports.
3. Add the record to `src/data/partners.json`:

```json
{
  "name": "Partner Name",
  "logo": "their-logo.png",
  "url": "https://their-site.com",
  "since": "2026",
  "blurb": "One line about the partnership.",
  "detail": "Two lines about what they actually get. This is what shows."
}
```

Shows on the home page partner band and on the Partners page. If the list is
empty the band does not render at all, rather than showing an empty logo row.

## Change taglines, mission, socials, the join steps

All in `src/data/site.json`:

- `tagline`, `heroLead`, `mission`, `focus` drive the home and About copy.
- `shortDescription` is spare copy for meta descriptions.
- `founded` and `simRacingSince` print on the About page.
- `contactEmail` feeds the footer and every "Partner with us" button.
- `socials` and `store`: any entry with a URL appears in the footer, on the
  Partners page and in the site's structured data. Empty ones disappear.
  `socials.discord` is what every "Join the team" button points at, so do not
  empty it.
- `hashtags` feed the About values band and the footer line.
- `pillars` are the four values. `title` and `line` show on both the home page
  and About; `detail` shows only on About.
- `join.lead` and `join.steps` are the Discord explainer. Three steps is what
  the layout is built for, and they appear on the home page only.

## Change the navigation

`src/data/nav.json` is the only place nav links are defined.

- `primary` is the header and the mobile menu.
- `footer` is the footer "Pages" column.
- `cta` names the site-wide header button by intent (`join`).
- `ctaOverrides` swaps that button on one path. `/partners` uses `partnership`,
  so the header on that page carries the mailto instead of the Discord invite.
  The two intents live in `src/lib/links.ts`, which is also where the mailto
  address and subject line come from.

Adding a page means adding a file in `src/pages/`, a line in `primary`, a line
in `footer`, and a `<url>` in `public/sitemap.xml`.

---

## Still open

- **Driver headshots.** There are none, so the roster is typographic. If you get
  them, the roster row is the place to add them.
- **Reach figures.** The Partners page deliberately says "ask us" instead of
  printing follower counts. If you want real numbers on the page, send them and
  they can be added with a date stamp.
- **Driver stats.** `irating` and `licence` render the moment they are filled in,
  and stay invisible until then. Nothing is made up to fill the slot.
- **A photograph of the sim rigs.** Every photo on the site is from the gaming
  side of the org. One picture of a wheel, a rig or a screen with a car on it
  would do more for the About page than anything else on this list.
- **Eastman font.** Only trial OTFs existed, so Nexa covers all display and body
  text and JetBrains Mono covers data. If Eastman is ever licensed, add the woff2
  to `public/fonts/` and update `--font-display` in `src/styles/global.css`.
