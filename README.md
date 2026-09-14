# Artemis Esports website

The website for Artemis Esports, an iRacing endurance, GT and NASCAR oval team:
<https://artemisesports.com>

Five pages, no database, no logins, no forms that submit anywhere. The build
turns the source in this folder into plain HTML, CSS and images, and a host
serves those files. Race results, the roster and the calendar come from three
JSON files that a Discord bot writes for you, so nobody has to touch code to
publish a result.

Lead developer: Cesar Vigil.

## The pages

| Page | What is on it |
|---|---|
| `/` | The team, the next race, the last six results, the cars, the drivers, how we race, the partner, and how to join |
| `/team` | The full roster, grouped road, oval and pitwall |
| `/about` | Where the org came from, the photos, the four values, how to join |
| `/partners` | What a partner gets, the results and roster as evidence, the channels, the contact |
| a bad URL | A branded not-found page that points home |

## The branches

There are four, and they do different jobs. Check which one you are on before
you change anything: `git branch --show-current`.

| Branch | What it is |
|---|---|
| `master` | Cesar's original site, kept as the record of what came before. Nothing new goes here. |
| `maintenance` | **Production.** This is the branch Vercel deploys to artemisesports.com, and the branch the Discord bot writes to. |
| `redesign` | The 2026 redesign, built over five passes. This is where the current design work lives, and it is what gets merged into `maintenance` at go-live. |
| `bot` | The Artemis data bot. It is a separate Node program that runs on a server or a laptop, not part of the website build, so it lives on its own branch. |

`docs/redesign-summary.md` says what changed in the redesign and what is still
open.

## Running it on your own machine

You need Node 22 or newer. Check with `node --version`; if you do not have it,
install it from <https://nodejs.org>.

```bash
npm install     # once, and again whenever package.json changes
npm run dev     # a local preview at http://localhost:4321
```

Leave `npm run dev` running while you edit. Save a file and the browser page
updates by itself. Press Ctrl+C in the terminal to stop it.

| Command | What it does |
|---|---|
| `npm install` | Downloads the tools the build needs into `node_modules/`. Not committed, safe to delete and reinstall. |
| `npm run dev` | The local preview. Use this while editing. |
| `npm run build` | Makes the real site in `dist/`. Takes a few seconds. |
| `npm run preview` | Serves the built `dist/` so you can check the real thing. |
| `npm run check:data` | Checks the three bot-owned JSON files against the rules. Runs automatically before every build. |

**`npm run build` fails if the data is wrong, and that is on purpose.** It runs
`check:data` first, and if a record breaks a rule the build stops and prints
which file, which record and which field. Nothing gets published, so the site
that is already live stays live. Do not remove that step.

## Where the content lives

Everything you would want to change is text in a file. No code changes needed
for any of it.

| Folder or file | Holds |
|---|---|
| `src/data/results.json` | Race results. Written by the bot. |
| `src/data/drivers.json` | The roster. Written by the bot. |
| `src/data/events.json` | The calendar. Written by the bot. |
| `src/data/site.json` | The tagline, the mission, the founding dates, the contact address, the socials, the four values, the three join steps |
| `src/data/nav.json` | The navigation links and which button the header carries |
| `src/data/cars.json` | The five garage captions |
| `src/data/partners.json` | The partner list |
| `src/assets/` | The photographs and the in-sim renders |
| `public/` | Things served exactly as they are: the fonts, the favicons, the social card, `robots.txt`, `sitemap.xml` |

`CONTENT.md` walks through each of these, including which records are still
placeholder data that has to be replaced.

## How the bot updates the site

Three of those files are written from Discord, by the Artemis data bot on the
`bot` branch. Anyone with Manage Server in the Discord can run:

- `/result` to add, edit or remove a race result
- `/driver` to add, edit or remove a roster entry
- `/event` to add, edit or remove a calendar entry
- `/data` to see what is stored, validate it, or list the leftover placeholders

The bot makes one commit per command straight to the branch Vercel deploys, the
host rebuilds, and the change is live in about a minute. It replies in Discord
with what changed and the commit it made.

You can still edit those three files by hand. The bot re-reads a file before
every write, so it will not overwrite your change. The rules a hand edit has to
follow are in `docs/data-contract.md`, and `npm run check:data` tells you if you
broke one.

## Deploying

Vercel builds this repository on every push to the production branch. Push to
`maintenance` and the site updates itself; there is nothing to upload.

`vercel.json` in this folder is the whole hosting configuration: the security
headers, the cache policy, the redirects from the old site's URLs, and the
trailing-slash rule. Vercel reads it on every deploy.

If Vercel ever goes away, `npm run build` still produces a `dist/` folder you
can drag onto any static host. `DEPLOY.md` covers both paths, including what
has to be re-created by hand on a plain cPanel host.

## The other documents

| File | What it answers |
|---|---|
| `PRODUCT.md` | Who the site is for, what counts as success, what the one action on each page is, and what must never be added |
| `DESIGN.md` | The visual system: colours, type, spacing, motion, components, accessibility, and why each decision was made |
| `CONTENT.md` | How to change any piece of content, and what is still placeholder |
| `DEPLOY.md` | How the site gets published, the headers, the redirects, and what to check afterwards |
| `docs/data-contract.md` | The exact shape of the three bot-owned JSON files. The bot and the site implement this identically; changing it changes both. |
| `docs/redesign-summary.md` | What the 2026 redesign changed, what it measured, and what the owner still has to decide |

## Built with

[Astro](https://docs.astro.build) 7, and nothing else. No UI framework, no CSS
framework, no analytics, no cookies, no third-party scripts. Nothing on the page
loads from another server.

The four web fonts are served from `public/fonts/` as `.latin.v2.woff2` files.
They are trimmed copies containing only the characters this site can show, which
is why they are a third smaller than the originals. `@fontsource/jetbrains-mono`
is still listed in `package.json` even though no code imports it: it is where
the two monospace files came from, and it is kept so the trimming can be redone
if a font ever needs replacing. See `DESIGN.md` section 3, which also explains
why a replacement font must be given a new filename.
