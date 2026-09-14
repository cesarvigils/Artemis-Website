# Updating the site

Everything you would normally edit lives in `src/data/`. Change a file, rebuild, upload. No code required.

After any edit, run:

```
npm run build
```

and upload the `dist/` folder (see DEPLOY.md).

---

## Add or edit a driver / crew member

Edit `src/data/drivers.json`. Copy an existing block:

```json
{
  "name": "Handle or Name",
  "role": "driver",
  "number": "24",
  "country": "USA",
  "focus": "GT3 / Endurance",
  "bio": "One short line about them.",
  "socials": {}
}
```

- `role` is one of: `driver`, `pitwall`, `staff`. The Team page groups by it.
- `number` shows as the big outlined car number. Leave `""` for crew.
- Keep `bio` to one line. Short reads stronger.

> The current entries are placeholders. Replace them with the real roster.

## Add a livery / race photo to the Garage

1. Drop the screenshot into `src/assets/racing/` (PNG or JPG, the bigger the better; the build optimizes it automatically).
2. Add an entry to `src/data/cars.json`:

```json
{
  "image": "your-file-name.png",
  "car": "Porsche 911 GT3 R",
  "caption": "One short line about the shot"
}
```

The homepage Garage strip picks it up in order.

## Add a partner

1. Drop a transparent logo (white version looks best) into `src/assets/partners/`.
2. Add to `src/data/partners.json`:

```json
{
  "name": "Partner Name",
  "logo": "their-logo.png",
  "url": "https://their-site.com",
  "blurb": "One line about the partnership."
}
```

Shows on the homepage partners band and the Partners page.

## Change taglines, mission, contact email, socials

All in `src/data/site.json`:

- `tagline`, `heroSub`, `mission`, `focus` control the homepage and About copy.
- `contactEmail` feeds every "Get in touch" button and the footer.
- `socials` entries that are non-empty appear in the footer automatically.
- `hashtags` feed the About band and footer.

## Photos on the About page

The three culture photos are imported at the top of `src/pages/about.astro`. Swap the file paths there if you want different shots (drop new photos in `src/assets/photos/` first).

---

## Open items (from the build)

- **Roster**: replace placeholder drivers with real names.
- **Socials**: fill in `site.json` socials (they're empty, so the footer hides them).
- **Partners**: only GLYTCH is listed. Add NordVPN or others once confirmed, with proper logo files.
- **Eastman font**: only trial OTFs exist in the workspace, so the site uses Nexa for everything (which you own). If you license Eastman later, add the woff2 to `public/fonts/` and update the `--font-body` token in `src/styles/global.css`.
