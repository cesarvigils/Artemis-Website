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

## 0b. `vercel.json`

`vercel.json` in the repo root is the whole hosting configuration. Vercel reads
it on every deploy; nothing in it needs a dashboard setting. Four things live
there.

**Security headers**, on every response: `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`,
`Strict-Transport-Security`, and a Content Security Policy. Vercel adds none of
these by default.

The CSP allows `'unsafe-inline'` for scripts and styles, and that is a
deliberate, honest compromise rather than an oversight. Astro inlines three
scripts per page (the JSON-LD block, the 57-byte `js`-class setter and the
client module) and one `<style>`, plus 9-21 `style=` attributes carrying the
animation delays. Their hashes change whenever `site.ts`, `site.json` or any
rendered data changes, so a hand-maintained hash list in a static file would
kill the page silently on the next Discord-bot data push. What the policy still
blocks is the whole attack surface a static site with no user input actually
has: every external script origin, every frame (`frame-ancestors 'none'`), every
form post (`form-action 'none'` - the site has no `<form>`; `mailto:` links are
navigations), and every non-`self` connection. If inline script ever becomes
unacceptable, the fix is a build step that writes the hashes, not a hand-kept
list.

**Two external origins are allowed, and only two**, both Umami's:
`script-src` gains `https://cloud.umami.is` (where the tag is served from) and
`connect-src` gains **both** `https://cloud.umami.is` and
`https://gateway.umami.is` (where the tag posts events to). Umami Cloud serves
the script from one host and receives from another, which is easy to miss: with
only `cloud.umami.is` in `connect-src` the script loads, the page looks fine,
and every single event is blocked with a CSP violation in the console and
nothing in the dashboard. That was measured, not guessed.

The tag itself is injected **only** when `PUBLIC_UMAMI_WEBSITE_ID` is set (see
§0c). With the variable unset the two origins are still named in the policy and
nothing ever reaches them, which is harmless and means turning analytics on is
an environment change rather than an environment change plus a header change.
If the team moves to a self-hosted Umami, `PUBLIC_UMAMI_SRC` and both CSP
directives have to name the new origin.

## 0c. Analytics environment variables

Two variables on the Vercel project, both read at **build** time, both
`PUBLIC_`-prefixed so Astro exposes them to the client bundle.

| Variable | Environment | What it does |
|---|---|---|
| `PUBLIC_UMAMI_WEBSITE_ID` | Production (and Preview, if you want preview traffic separated) | The website id from the Umami dashboard. **Setting it is the on switch.** Unset, the `<script>` tag is not in the HTML at all and the footer says "We run no analytics and set no cookies". Set, the tag ships and the footer says "Cookieless analytics, no consent banner". |
| `PUBLIC_UMAMI_SRC` | Optional | The script URL. Defaults to `https://cloud.umami.is/script.js`. Only change it for a self-hosted or proxied instance, and change the CSP with it. |

Because they are build-time, changing either needs a redeploy to take effect -
Vercel does that automatically when you save an environment variable, but the
change is not live until that build finishes.

There is no consent banner and that is deliberate: Umami sets no cookies and
stores no personal data, so there is nothing to consent to. If the team ever
adds a tool that does, the banner comes with it and this paragraph is wrong.

Every Discord button and the partner mailto carry `data-umami-event="cta"` plus
`data-umami-event-placement` (`header`, `hero`, `sticky`, `join`, `footer`)
and `data-umami-event-audience` (`driver`, `partner`), so the dashboard answers
"which audience pressed which button, where" with no further setup.

**Cache headers.** `/_astro/*` and `/fonts/*` get a year with `immutable`.
`/_astro` filenames carry a content hash, so that is free. **`/fonts/*` does
not** - if a font file is ever replaced, give the new file a new name, or
browsers will keep the old one for a year. That is what the `.v3` in
`archivo-core.latin.v3.woff2` is for: four files, two variable families split by
`unicode-range`, and a re-subset ships as `.v4` with the four `@font-face` rules
in `src/styles/global.css` and the two preloads in `src/layouts/Base.astro`
updated to match. `public/fonts/OFL.txt` ships beside them because the licence
requires it. The icons and the OG card get a day.
The HTML deliberately keeps Vercel's default (`max-age=0, must-revalidate`), so
a bot-driven data push is live the moment the build finishes.

**Redirects** for the five legacy URLs (see §3) plus `/team.html` and `/404`,
all 301.

**`"trailingSlash": false`.** The served URL, the `<link rel="canonical">` and
`sitemap.xml` all use the bare form (`/team`, not `/team/`), which is also what
every internal link in `nav.json` uses - so no internal navigation costs a
redirect. **All three have to agree.** If you ever flip this, flip the canonical
in `src/layouts/Base.astro` and every `<loc>` in `public/sitemap.xml` with it.

Not covered by `vercel.json`, because it cannot be: **preview deployments are
crawlable.** Every `*.vercel.app` preview serves the same `robots.txt` with
`Allow: /`. Set `X-Robots-Tag: noindex` for the Preview environment in the
Vercel project settings (Settings -> Deployment Protection), which is
environment-aware in a way a static config file is not.

## 1. Build

```
cd Website
npm install        # first time only
npm run build
```

This produces a `dist/` folder containing the whole site (`index.html`,
`team/index.html`, etc.).

**Expected output:** about **2.5 MB** total, 76 files, and it should finish in
under 10 seconds. If `dist/` comes out at tens of megabytes, something started
copying full-size original photos again; see `DESIGN.md` section 8 before
shipping.

Largest files in a normal build:

| File | Size |
|---|---|
| the About group photo at 1920px (webp) | ~228 KB |
| the hero render at 1920px (webp) | ~116 KB |
| `og.png` (the social card) | ~116 KB |
| `index.html` | ~109 KB raw, **~18 KB over brotli** |
| all four web fonts together | **48 KB** |
| all CSS | inlined into each page, 5 to 9 KB gzipped per route |
| all client JavaScript | 5.8 KB, inlined, no external request |

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

The new site keeps `/team`, `/about`, `/partners` and `/join` (now a real page
again). These old pages no longer exist:

- `/legacy`, `/calendar`, `/results`, `/media`, `/team.html`

**On Vercel these are already handled** - the `redirects` block in `vercel.json`
sends each of them on with a 301:

| Old URL | Goes to | Why |
|---|---|---|
| `/results` | `/#scoreboard` | The Scoreboard is a home-page module |
| `/calendar` | `/` | The next-race strip is the first thing under the hero |
| `/media` | `/about` | The photos live in the origin story |
| `/legacy` | `/about` | Same |
| `/team.html` | `/team` | The old flat-file URL |
| `/404` | `/` | `dist/404.html` is also a real file at `/404`, which a host serves with a 200. The page is `noindex` as well |

The old `/partners#contact` anchor still works: the contact block on the
Partners page kept its `id="contact"`.

**cPanel / LiteSpeed only.** Vercel ignores `.htaccess`. If the site is ever
served from the fallback host instead, put the same mapping there by hand:

```apacheconf
Redirect 301 /results /#scoreboard
Redirect 301 /calendar /
Redirect 301 /media /about
Redirect 301 /legacy /about
Redirect 301 /team.html /team
```

That snippet covers the redirects and nothing else: the security headers, the
cache policy and the slash rule in `vercel.json` all have to be re-created in
`.htaccess` too if the fallback host ever becomes the real one.

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
- Open the browser console on the home page, open the mobile menu and press the
  garage arrows. **Zero errors.** Anything that says "Refused to ... because it
  violates the following Content Security Policy directive" means the CSP in
  `vercel.json` needs the matching directive loosened - fix the header, never
  the page.
- Check one legacy URL (`/results` is the one most likely to be in an old
  Discord pin) and confirm it 301s to `/#scoreboard`.
- Check `https://artemisesports.com/team/` (with the slash) redirects to
  `/team` (without), and that the canonical tag on the page agrees.
