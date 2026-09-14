# Deploying artemisesports.com

The site builds to plain static files. Your current host (LiteSpeed / cPanel-style)
serves them as-is; nothing to install on the server.

## 1. Build

```
cd Website
npm install        # first time only
npm run build
```

This produces a `dist/` folder containing the whole site (`index.html`,
`team/index.html`, etc.).

**Expected output:** about **2.2 MB** total, roughly 50 files, and it should finish
in under 10 seconds. If `dist/` comes out at tens of megabytes, something started
copying full-size original photos again; see `DESIGN.md` section 8 before shipping.

Largest files in a normal build:

| File | Size |
|---|---|
| the hero render at 1920px (webp) | ~410 KB |
| the About group photo at 1920px (webp) | ~230 KB |
| `og.png` (the social card) | ~115 KB |
| the page CSS, all pages combined | ~27 KB |
| all client JavaScript | ~3 KB |

## 2. Upload

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
Redirect 301 /join /
Redirect 301 /results /
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
- Check the "Join the team" button opens the Discord invite.
- Share a link in Discord or on X to confirm the social preview card shows the
  Artemis lockup.
