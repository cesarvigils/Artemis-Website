# Deploying artemisesports.com
The site builds to plain static files. Your current host (LiteSpeed / cPanel-style) serves them as-is; nothing to install on the server.
## 1. Build
```
cd Website
npm install        # first time only
npm run build
```
This produces a `dist/` folder containing the whole site (`index.html`, `team/index.html`, etc.).
## 2. Upload
Upload the **contents** of `dist/` to your web root (usually `public_html/`), replacing what's there. Two easy ways:
- **cPanel File Manager**: zip `dist/`, upload the zip to `public_html`, extract, and move the contents up one level if needed.
- **FTP/SFTP** (FileZilla etc.): drag the contents of `dist/` into `public_html`.
Keep a copy of the old site somewhere until you're happy with the new one.

## 3. URLs that carry over

The new site keeps `/team` from the old site. These old pages no longer exist:

- `/legacy`, `/calendar`, `/results`, `/media`, `/join`

If you want, add redirects in `.htaccess` (works on LiteSpeed):

```apacheconf
Redirect 301 /join /partners
Redirect 301 /media /about
Redirect 301 /legacy /about
```

(Leave `/calendar` and `/results` to the custom 404, or point them at `/` the same way.)

## 4. Verify after upload

- Visit the domain in a private window; hard-refresh (Cmd+Shift+R).
- Check `/team`, `/about`, `/partners`, and a bad URL (should show the branded 404).
- Share a link in Discord/Twitter to confirm the social preview card shows the Artemis banner.
