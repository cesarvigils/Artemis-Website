# Free hosting & tooling alternatives for artemisesports.com

Researched 13 Sep 2026. Current site: Astro 7 static build, JSON-driven content, GSAP animations, deployed by hand-uploading `dist/` to paid cPanel/LiteSpeed hosting.

---

## 1. Free hosting for the existing static build (keep Astro)

| Host | Cost | Custom domain + HTTPS | Free-tier limits | Commercial/org use OK? | Build-on-push from GitHub | Gotcha |
|---|---|---|---|---|---|---|
| **Cloudflare Pages** | $0 | Yes, up to 100 custom domains/project, auto SSL | 500 builds/mo (1 concurrent), 20,000 files/site, 25 MiB/file. Static-asset bandwidth is **unmetered** (confirmed by multiple independent 2026 comparisons; Cloudflare's own limits page doesn't state a bandwidth number, so treat "unlimited" as third-party-reported, not contractually documented) | Reported allowed by third-party sources; Cloudflare's Pages limits page doesn't itself state a commercial restriction — **not independently verified against Cloudflare's ToS this session** | Yes | Cloudflare is steering new projects toward its unified "Workers" product (Pages is in maintenance mode but still fully supported). For an Astro **static** build, image optimization (Sharp) runs at build time in Node during CI, so there's no runtime image-caveat; the well-known "Sharp doesn't run in the `workerd` edge runtime" issue only bites if the site later switches to SSR/hybrid mode with the Cloudflare adapter. |
| **GitHub Pages** | $0 | Yes, free HTTPS cert (Let's Encrypt) | 1 GB published site size; **100 GB/month bandwidth (soft limit)**; 10 builds/hour soft limit (doesn't apply when using a custom GitHub Actions workflow) | Yes, no restriction | Yes, via GitHub Actions | Needs Astro's official GitHub Action / a workflow YAML file — not zero-config like the others. Free Pages hosting for personal/free-tier GitHub accounts requires the **repo to be public** (private-repo Pages needs a paid GitHub plan) — this is long-standing GitHub policy, not re-verified via a fetch this session. |
| **Netlify (Free/"Individual" plan)** | $0 | Yes, custom domain + SSL included | Shared pool of **300 credits/month**: builds cost 15 credits each (~20 builds/mo), bandwidth 20 credits/GB (~15 GB/mo) — it's a hard cap, not overage-billed; once exhausted, sites pause until next cycle | Plan is labeled "Individual" vs. Pro/Enterprise "Team" — no explicit commercial-use ban was found, but **not fully verified**; check Netlify's ToS if the team is registered as a business | Yes | ~15 GB/month is easy to blow through if traffic spikes (race-weekend links from Discord/social, etc.); whether signup requires a credit card was **not verified** this session |
| **Vercel (Hobby plan)** | $0 | Yes, 50 domains/project | 1,000,000 edge requests, 100 deployments/day, 4 CPU-hrs, 5,000 image transformations/mo (per Vercel's own docs, fetched today) | **No** — Vercel's official docs state plainly: "the Hobby plan restricts users to non-commercial, personal use only." A team/brand site (sponsor logos, merch links, being paid to build/host it) plausibly counts as commercial and risks account action | Yes | This is the one platform with an explicit, official commercial-use ban on its free tier — worth ruling out for a sports team brand unless the site stays strictly non-monetized |
| **Render (static sites)** | $0 | Yes, free TLS | Render's free **static site** hosting doesn't sleep/cold-start (unlike their free web services) and includes a CDN + custom domains | Not verified this session | Yes | Less documented/compared than the big four above; reasonable fallback, not a clear upgrade over Cloudflare Pages |

### Recommended path: Cloudflare Pages

Best combination for this team: no documented commercial-use ban, no hard bandwidth ceiling, generous build minutes, and it can also manage the domain's DNS for free.

**Steps:**
1. Push the existing Astro project to a GitHub repo (can stay private — Cloudflare Pages doesn't require public repos, unlike GitHub Pages).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings: framework preset "Astro", build command `npm run build`, output directory `dist`, and set the Node version (env var `NODE_VERSION` or a `.nvmrc`) — confirm Astro 7's minimum supported Node version in `package.json` `engines`, Node 20 or 22 is a safe default.
4. Pages project → Custom domains → add `artemisesports.com` and `www.artemisesports.com`.
5. DNS: either (a) move the domain's nameservers to Cloudflare (free DNS hosting, simplest, lets Cloudflare auto-manage the records) or (b) keep the current registrar's DNS and add the CNAME/ALIAS record Cloudflare gives you pointing at the `*.pages.dev` address. Either way this is a change made **at the domain registrar**, not at the old cPanel host.
6. Cancel/downgrade the paid cPanel hosting once DNS has cut over and the site is verified live (keep the domain registration itself — that's separate from hosting).

**Content updates for a non-technical volunteer:** open the JSON file on github.com, click the pencil (edit) icon, make the change in the browser, commit to `main`. GitHub's webhook fires automatically, Cloudflare Pages rebuilds and redeploys in roughly 1–2 minutes — no local `npm run build`, no FTP/cPanel upload. (Section 2 below covers replacing raw JSON editing with a real form-based CMS.)

**Estimated monthly cost: $0**, plus whatever the domain renewal already costs at the current registrar (unchanged either way — not researched here since it's unrelated to hosting choice).

---

## 2. Content editing without code for volunteers (still free)

All of these are "Git-based CMS" tools: a web admin UI that commits changes back into the GitHub repo, so they layer on top of option 1 rather than replacing it.

| Tool | Free? | Needs a backend/auth? | Works on Cloudflare Pages / GitHub Pages (static)? | Edits JSON? | Setup effort (rough) |
|---|---|---|---|---|---|
| **Decap CMS** (formerly Netlify CMS) | Yes, OSS | Netlify Identity (its original zero-config auth option) is **deprecated/sunset**, so a GitHub OAuth app + a small proxy (e.g. a hosted "DecapBridge" service, or a self-hosted OAuth worker) is now required | Yes, with the OAuth proxy | Yes | ~3–4 hrs (auth is the fiddly part) |
| **Sveltia CMS** | Yes, OSS/MIT | Same class of requirement (GitHub OAuth), but it's a drop-in replacement that reads Decap's existing `config.yml` format, is actively maintained (Decap's development has slowed), and its own docs specifically call out Astro as a good fit | Yes | Yes (git-based, framework-agnostic) | ~1–3 hrs |
| **Keystatic** | Yes, OSS/MIT | "Local mode" needs no auth but requires running a local dev server (not friendly for a non-technical volunteer); "GitHub mode" needs a GitHub App plus a serverless/API route, which pure static GitHub Pages hosting can't provide (works fine on Cloudflare Pages Functions or Vercel) | Partial — needs a host with function support for the volunteer-friendly GitHub mode | Yes (also Markdoc/YAML) | ~2–4 hrs |
| **TinaCMS** | Free tier: 2 users, unlimited content, via managed **TinaCloud** (self-hosting the OSS core to avoid TinaCloud is possible but adds your own DB + GraphQL API + auth to maintain — not worth it for this team) | TinaCloud handles GitHub auth for you | Yes | Yes | ~2–3 hrs |
| **Pages CMS** | Yes, 100% free, MIT | GitHub-only login, but the OAuth app is already run by pagescms.org — no proxy/backend to stand up yourself | Yes, explicitly supports Astro and GitHub-hosted sites | Yes (Markdown/YAML/JSON) | ~1 hr — single `.pages.yml` config file |

**Recommendation: Pages CMS.** It's purpose-built for exactly this situation (small team, content in a GitHub repo, zero appetite for standing up an OAuth backend) and has the lowest setup effort of the group. **Sveltia CMS** is the fallback if the team later wants a more mature/full-featured editor UI and is willing to spend the extra hour registering a GitHub OAuth app.

---

## 3. Alternatives to Astro entirely

### (a) Other free static site generators

- **Eleventy (11ty):** beats Astro only if the team wants a leaner, template-only tool with no component/islands model. No real reason to migrate a 5-page site that already works in Astro.
- **Hugo:** beats Astro on raw build speed and a zero-npm single-binary toolchain, but Go templates are less approachable for volunteers than editing JSON. No reason to migrate.
- **Next.js (static export):** only pays off if the team wants React interactivity, ISR, or server features later. Pure overhead for a 5-page marketing site. No reason to migrate.
- **SvelteKit (static):** nice developer experience, small bundles, but no concrete advantage over Astro here. No reason to migrate.
- **Plain HTML/CSS/JS:** beats Astro only if the goal is to remove all build tooling and have volunteers hand-edit raw HTML — but that throws away the JSON-driven content model and automatic image optimization the team already has. Likely a downgrade.

**Bottom line: there is no compelling technical reason to migrate away from Astro.** The team's actual pain points (manual `dist/` upload, paid hosting) are deployment-workflow and hosting-cost problems, not framework problems, and are solved by Section 1.

### (b) No-code builders with a genuinely free tier

| Builder | Cost for a custom domain | Design ceiling | Animation capability | Who owns the code/export | Lock-in |
|---|---|---|---|---|---|
| **Framer** | Not free — Basic plan ~$10/mo billed annually (first-year domain thrown in as of a Jan 2026 promo); free plan is subdomain-only | High (near design-tool fidelity) | Strong, built-in no-code interactions | Framer hosts it; limited/no meaningful code export | High |
| **Webflow** | Not free — no custom domain on the free plan; a paid site plan is required (widely cited around $14–29+/mo, not independently re-verified this session) | Very high (professional visual dev tool + CMS) | Excellent, industry-leading no-code interactions | Can export static HTML/CSS/JS on paid tiers, which meaningfully reduces lock-in | Medium |
| **Carrd** | $19/year (Pro Standard is the cheapest tier that includes a custom domain; free and Pro Lite do not) | Low–medium; Carrd is built around single-page sites, a poor structural fit for a true 5-page multi-nav team site | Basic | Hosted only, no export | Medium, but cheapest paid option in this table |
| **Google Sites** | Not free for a real custom domain — needs Google Workspace (roughly $72–87/yr). A free domain-forwarding redirect exists as a workaround but it's not the same as native custom-domain hosting (weaker branding/SEO, redirect quirks) | Low, limited layout control | Essentially none | No code ownership | High |
| **Wix (free plan)** | Not free — free plan is a Wix subdomain with Wix ads and a 500MB cap; custom domain needs a paid plan (commonly cited ~$16+/mo) | High (drag-and-drop, many templates) | Decent built-in effects | No export, fully hosted | High |
| **Squarespace** | No free plan at all (14-day trial only) — skip for a $0 budget | High | Good | No export | High |
| **Notion + Super / Potion** | Not free — Super's Personal plan (~$12/mo) or Potion Premium is required for a custom domain; Notion's own native "Sites" custom-domain add-on is $8–10/mo on top of a paid Notion plan | Low–medium, content-doc-shaped | Minimal | No export | High |
| **Bento / Linktree-style pages** | Free tier exists, but these are link-in-bio pages, not multi-page sites — wrong category of tool for a 5-page team site with roster/schedule/results content. Only useful as a supplementary link page | N/A | N/A | N/A | N/A |

None of the no-code builders offer both a genuinely free custom domain **and** design/animation headroom comparable to what GSAP-powered Astro already delivers. This matches the prompt's own framing — everything with a real free tier either has no custom domain (Wix, Google Sites without Workspace) or is a mismatch for a 5-page brand site (Carrd, Bento).

---

## 4. Recommendation

**This month:** keep the Astro codebase as-is. Push it to a GitHub repo, connect that repo to **Cloudflare Pages** (build command `npm run build`, output `dist`), point `artemisesports.com`'s DNS at Cloudflare, then cancel the paid cPanel hosting. Layer **Pages CMS** on top so volunteers edit JSON content through a simple web form on pagescms.org instead of hand-editing files on GitHub.
**Cost:** $0/month hosting (down from the current paid cPanel bill), just the existing domain renewal, which is unchanged by this move.
**Hours:** roughly 2–4 hours total, one-time (repo setup, Cloudflare Pages connect, DNS cutover, Pages CMS config file).
**The case for staying on Astro:** it already works, builds fast, ships optimized images, and costs nothing to run — the real problem the owner is feeling is the manual `dist/`-upload deploy workflow and a paid host, not the framework. None of the alternative static-site generators offer a concrete improvement for a 5-page site, and every no-code builder either charges for a custom domain, bans commercial use on its free tier (Vercel Hobby), or caps the design/animation ceiling below what the team already has with GSAP in Astro. Migrating frameworks would cost more volunteer hours than the hosting/CMS swap above saves.

---

## 5. Sources

- https://developers.cloudflare.com/pages/platform/limits/ — official Cloudflare Pages limits page
- https://vercel.com/docs/plans/hobby — official Vercel Hobby plan docs
- https://vercel.com/docs/limits/fair-use-guidelines — Vercel commercial-use restriction wording
- https://www.netlify.com/pricing/ — official Netlify pricing/free plan page
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits — official GitHub Pages usage limits
- https://docs.astro.build/en/guides/deploy/github/ — official Astro GitHub Pages deploy guide
- https://docs.astro.build/en/guides/deploy/cloudflare/ — official Astro Cloudflare deploy guide
- https://pagescms.org/ — Pages CMS product site and FAQ
- https://github.com/sveltia/sveltia-cms — Sveltia CMS repo, Astro compatibility claim
- https://www.framer.com/pricing — Framer official pricing page
- https://support.squarespace.com/hc/en-us/articles/206541787-Free-Squarespace-domain-offer — Squarespace domain offer terms
- https://super.so/blog/notion-sites-pricing — Super/Notion Sites custom-domain pricing
- https://snapdeploy.dev/blog/free-cloud-deployment-platforms-2026-comparison — 2026 free-host bandwidth comparison
- https://temps.sh/blog/netlify-free-plan-limits-2026 (via netli.fyi summary) — Netlify 300-credit free tier breakdown

Notes on confidence: figures pulled from official docs (Cloudflare limits, Vercel Hobby/fair-use, GitHub Pages limits) were fetched directly this session. Netlify credit-card requirement, Cloudflare's exact commercial-use policy, Render's precise free-tier numbers, and Webflow's/Wix's exact paid-plan price points were **not independently fetched from a primary source this session** and are flagged "not verified" above where they appear.
