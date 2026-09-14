# Deploying artemisesports.com

The site builds to plain static files. Vercel builds it from the repository on
every push, which is what makes the Discord bot work: the bot commits a data
change, Vercel rebuilds, and the page is live about a minute later. Uploading a
built `dist/` to a cPanel/LiteSpeed host by hand still works and is the fallback.

## 0. What happens on every push

1. Vercel runs `npm run build`.
2. `prebuild` runs `npm run check:data`, which validates `results.json`,
   `drivers.json` and `events.json` against `docs/data-contract.md`.
3. If any record is invalid the build **fails**, nothing is published, and the
   previous deployment keeps serving. The failure output names the file, the
   index and the field.

That is the safety net behind letting a Discord command write to the repo. Do
not remove the `prebuild` hook.

## 1. Build

```
cd Website
npm install        # first time only
npm run build
```

This produces a `dist/` folder containing the whole site (`index.html`,
`team/index.html`, etc.).

**Expected output:** about **2.0 MB** total, roughly 45 files, and it should
finish in under 10 seconds. If `dist/` comes out at tens of megabytes, something
started copying full-size original photos again; see `DESIGN.md` section 8
before shipping.

Largest files in a normal build:

| File | Size |
|---|---|
| the hero render at 1920px (webp) | ~115 KB |
| the About group photo at 1920px (webp) | ~230 KB |
| `og.png` (the social card) | ~115 KB |
| all CSS | inlined into each page, about 6 KB gzipped per route |
| all client JavaScript | ~3 KB, inlined, no external request |

`robots.txt` and `sitemap.xml` are hand-maintained in `public/`. Adding a page
means adding a `<url>` to the sitemap.

## 2. Upload (only when not deploying through Vercel)

Upload the **contents** of `dist/` to your web root (usually `public_html/`),
replacing what's there. Two easy ways:

- **cPanel File Manager**: zip `dist/`, upload the zip to `public_html`, extract,
  and move the contents up one level if needed.
- **FTP/SFTP** (FileZilla etc.): drag the contents of `dist/` into `public_html`.

Keep a copy of the old site somewhere until you're happy with the new one.

## 3. URLs that carry over

The new site keeps `/team`, `/about` and `/partners`. These old pages no longer
exist:

- `/legacy`, `/calendar`, `/results`, `/media`, `/join`

If you want, add redirects in `.htaccess` (works on LiteSpeed):

```apacheconf
Redirect 301 /join /#join
Redirect 301 /results /#results
Redirect 301 /calendar /
Redirect 301 /media /about
Redirect 301 /legacy /about
```

`/results` and `/calendar` now point at the home page, because that is where the
results table and the next-race strip live. The old `/partners#contact` anchor
still works: the contact block on the Partners page kept its `id="contact"`.

## 4. Verify after upload

- Visit the domain in a private window; hard-refresh (Cmd+Shift+R / Ctrl+F5).
- Check `/team`, `/about`, `/partners`, and a bad URL (should show the branded 404).
- Check the "Next race" strip shows a future race and its countdown is running.
- Check the "Join the team" button opens the Discord invite, and that the header
  button on `/partners` opens a mail client instead.
- Run a `/result` in Discord against a test entry and confirm it appears on the
  home page a minute later, then remove it again.
- Share a link in Discord or on X to confirm the social preview card shows the
  Artemis lockup.
