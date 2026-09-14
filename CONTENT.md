# Updating the site

Everything you would normally edit lives in `src/data/`. Change a file, rebuild,
upload. No code required.

After any edit, run:

```
npm run build
```

and upload the `dist/` folder (see DEPLOY.md).

---

## Fill in

These records are **placeholders**. They are realistic, but they are not real.
Every one of them carries `"_placeholder": true` in the JSON (that flag is never
rendered; it is a marker for you). Replace the content and delete the flag.

| Where | What is fake | How to replace |
|---|---|---|
| `src/data/drivers.json` | All 8 entries: names, countries, car numbers, focus lines and bios | Replace `name`, `country`, `number`, `focus` and `bio` with the real roster. Keep `group` as `road`, `oval` or `crew`. Delete `"_placeholder": true` from each entry you fix. |
| `src/data/drivers.json` -> `stats` | `irating` and `licence` are empty on purpose | Fill them in only if you want them public. Empty values do not render, so a half-filled roster still looks right. |
| `src/data/drivers.json` -> `socials` | Empty on every driver | Add `{"x": "https://...", "twitch": "https://..."}` per driver. Only non-empty links render. |
| `src/data/results.json` | All 6 results: finishing positions, driver names and the note lines | The **events, tracks and dates are real** and can stay. Replace `position`, `driver` and `note` with what actually happened, then delete the flag. |
| `src/data/events.json` | All 3 entries: the specific rounds and start times | Petit Le Mans at Road Atlanta (25-27 Sep 2026) is real. The two league rounds after it are invented. Replace them, or delete them. |
| `src/pages/about.astro` | The two paragraphs under "Where this came from" | Draft copy written from the two facts we had (founded 2017, iRacing since 2023). Rewrite in your own words. |
| Hero photo | The car carries a **NordVPN** decal | If that is not a current partner, swap the hero image (see "Change the hero photo"). |

**Not placeholders, already correct:** the tagline, mission, the four pillars, the
hashtags, the contact email, every social and store URL, the Discord invite, and
the GLYTCH Energy partner entry.

---

## Add or edit a driver / crew member

Edit `src/data/drivers.json`. Copy an existing block:

```json
{
  "name": "Handle or Name",
  "group": "road",
  "number": "24",
  "country": "USA",
  "focus": "GT3 / Endurance",
  "bio": "One short line about them.",
  "socials": {},
  "stats": { "irating": "", "licence": "" }
}
```

- `group` is one of `road`, `oval`, `crew`. The Team page makes one section per
  group that has at least one member, in that order. A group with nobody in it
  does not render.
- `number` shows as the large outlined car number. Leave `""` for crew; their row
  simply starts at the name instead.
- `focus` is the short teal line (discipline, role). Keep it to a few words.
- `bio` is one line. Short reads stronger.
- `socials` and `stats` render only when they have values, so you can leave them
  empty and fill them in later.
- The home page shows the **first four non-crew entries** as a teaser. Order the
  file so the four you want up front come first.

## Add or change a race result

Edit `src/data/results.json`. Order does not matter; the site sorts newest first
and the home page shows six, the Partners page four.

```json
{
  "date": "2026-09-06",
  "event": "Suzuka 1000",
  "track": "Suzuka International Racing Course",
  "series": "iRacing Special Event",
  "class": "GT3",
  "position": 2,
  "driver": "Ferreira / Kowalczyk / Callaghan",
  "note": "Two stops on strategy, no contact all race."
}
```

- `date` must be `YYYY-MM-DD`.
- `position` is a number. 1, 2 and 3 are shown in teal as podiums; the rest are grey.
- `track` and `note` are printed together as the small line under the event name.
  Keep `note` to one sentence, or leave it out.
- The **newest result is also the hero proof point** on the home page, so make sure
  the top of this file is something you are happy to lead with.

## Add or change a calendar entry

Edit `src/data/events.json`. The site shows the first entry whose end date has not
passed as "Next race". When the list runs out, the whole strip disappears rather
than showing something stale, so keep one or two future entries in it.

```json
{
  "name": "Petit Le Mans",
  "track": "Road Atlanta",
  "date": "2026-09-25",
  "endDate": "2026-09-27",
  "start": "2026-09-25T16:00:00Z",
  "classes": ["GTP", "LMP2", "GT3"],
  "status": "entered"
}
```

- `date` / `endDate` are `YYYY-MM-DD`. Set `endDate` the same as `date` for a
  one-day race, or leave it out.
- `start` is the green-flag time in UTC (`Z`). It only drives the "In 11d 04h 22m"
  countdown, which is added by JavaScript. Without it, the date still shows.
- `classes` is a list; it prints as `GTP / LMP2 / GT3`.

## Change the six garage photos

The garage has **six fixed slots** by design. Changing a caption is a data edit;
changing a photo is a two-line code edit (this is deliberate, see DESIGN.md §8 -
it is what keeps the build from shipping 70 MB of full-size originals).

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

## Change the hero photo

1. Put the new render in `src/assets/racing/`.
2. In `src/pages/index.astro`, change the `import heroSource from ...` line.
3. Change the `alt` text on the `<Hero ... alt="..." />` line just below it to
   describe the new shot.

## Change the About photos

The three photos are imported at the top of `src/pages/about.astro`. Drop new
files in `src/assets/photos/`, change the import paths, and update each `alt`.
Sizes: the wide one is used at up to 1920px, the other two at up to 1280px.

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
- `socials` and `store`: any entry with a URL appears in the footer and on the
  Partners page. Empty ones disappear. `socials.discord` is what every
  "Join the team" button points at, so do not empty it.
- `hashtags` feed the About band and the footer line.
- `pillars` are the four values, used on both the home page and About.
- `join.lead` and `join.steps` are the Discord explainer. Three steps is what the
  layout is built for.

## Change the navigation

`src/data/nav.json` is the only place nav links are defined. `primary` is the
header and the mobile menu, `footer` is the footer column, `cta` is the button.
Adding a page means adding a file in `src/pages/` and a line here.

---

## Still open

- **Driver headshots.** There are none, so the roster is typographic. If you get
  them, the roster row is the place to add them.
- **Reach figures.** The Partners page deliberately says "ask us" instead of
  printing follower counts. If you want real numbers on the page, send them and
  they can be added with a date stamp.
- **Eastman font.** Only trial OTFs existed, so Nexa covers all display and body
  text and JetBrains Mono covers data. If Eastman is ever licensed, add the woff2
  to `public/fonts/` and update `--font-display` in `src/styles/global.css`.
