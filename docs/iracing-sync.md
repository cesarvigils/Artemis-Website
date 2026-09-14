# iRacing statistics sync

A nightly GitHub Action asks iRacing for each driver's iRating, safety rating
and last ten official races and commits the answer to `src/data/stats.json`.
The team page reads that file; nothing else in the site depends on it.

- Script: `scripts/fetch-iracing.mjs` (no dependencies, Node 22+)
- Workflow: `.github/workflows/update-stats.yml` (nightly at 09:17 UTC, plus a manual button)
- Output: `src/data/stats.json`, the shape defined in `docs/data-contract.md`
- Offline fixtures: `scripts/fixtures/iracing/`, used by `npm run test:sync`

Nothing happens until a driver has an `iracingId`. With today's roster the sync
writes an empty (but valid) file and exits successfully.

## 1. The iRacing account

The `/data` API has no API key, no OAuth and no service accounts: it is the
ordinary member login, and the account needs an **active iRacing
subscription** to see anything.

Use a **dedicated member account** rather than a team member's personal one:

- Two-factor authentication (iRacing calls it "legacy authentication" when it is
  off) **must be disabled** on it. An account with 2FA answers the login with
  `verificationRequired`, which no unattended job can satisfy; the script stops
  with exit code 2 and says exactly that.
- Its password ends up in a GitHub secret. A separate account keeps a personal
  login (and anyone's payment details) out of that blast radius.
- If the password changes, the sync starts failing that night. Update the secret.

The script never sends the plain password: it sends
`base64(sha256(password + lowercased email))`, iRacing's documented legacy
hashing. It never logs the password, the hash or the session cookies.

## 2. The customer id

Each driver's `iracingId` is their iRacing **customer id** (`cust_id`), a number
like `123456`. It is not the display name and it never changes.

Where to find it:

- The driver signs in at `members.iracing.com` and opens **Account**: the
  customer id is on that page.
- Or: open the driver in any results or profile page on the member site; the URL
  carries `custid=123456`.

Anyone can read anyone's public licence data, so a driver only has to tell you
the number once; they never share their own login.

## 3. Putting the id on a driver

`iracingId` is an optional field on a `drivers.json` record (data contract 1.2),
an integer between 1 and 99999999.

- **Via the Discord bot**: edit the driver the way you edit any other field. The
  bot does a read-modify-write of the whole record and preserves fields it does
  not know, so the value survives later edits.
- **By hand**: add one line to the driver's record in `src/data/drivers.json` and
  commit it.

```json
{
  "id": "mateo-ferreira",
  "name": "Mateo Ferreira",
  "role": "driver",
  "group": "road",
  "number": "7",
  "country": "BRA",
  "focus": "GT3 / Endurance",
  "iracingId": 123456,
  "active": true
}
```

Drivers without the field are skipped. A malformed value is skipped with a
warning in the job log rather than failing the whole sync.

## 4. The two repository secrets

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `IRACING_EMAIL` | the login email of the dedicated iRacing account |
| `IRACING_PASSWORD` | that account's password, in plain text (the script hashes it before sending) |

Nothing else is needed. The push uses the built-in `GITHUB_TOKEN`, which the
workflow already grants `contents: write`.

## 5. Running it

- **Nightly**: 09:17 UTC, automatically, on the branch the workflow file lives on.
- **By hand**: GitHub → **Actions** → **update-stats** → **Run workflow**, and pick
  the branch. Do this after adding the first `iracingId` instead of waiting a day.
- **Locally, for real**: `IRACING_EMAIL=... IRACING_PASSWORD=... npm run sync:iracing`
- **Locally, offline** (no credentials, sample data):
  ```
  node scripts/fetch-iracing.mjs --fixture scripts/fixtures/iracing --dry-run
  ```
  Drop `--dry-run` to write `src/data/stats.json`; delete the file afterwards
  unless you meant to commit fixture data.
- **Tests**: `npm run test:sync`.

The workflow commits only when the data actually changed. The script ignores its
own `updated` timestamp when comparing, so a quiet week produces no commits, no
deploys and no noise.

## 6. When it fails

**The site is unaffected.** `stats.json` is optional everywhere: if it is
missing, empty, or a driver has no entry, the team page simply shows nothing for
that driver. `check:data` validates the file when it exists but never fails the
build because of it, so a broken sync cannot take the site down. The last good
`stats.json` stays committed until a successful run replaces it.

What a failure looks like, by exit code:

| Code | Meaning | What to do |
|---|---|---|
| 2 | Authentication failed | Check the two secrets. If the message mentions two-factor, 2FA is on for that account: disable it or move to a dedicated account. Also check the subscription is still active. |
| 3 | An API call failed | Usually iRacing maintenance (Tuesday mornings US time) or a rate limit. Re-run the workflow later; no action needed if the next night succeeds. |
| 4 | The built document broke the data contract | The API returned something unexpected. Nothing was written. Open an issue with the job log; the script prints every rule that failed. |

GitHub emails the repository owner when a scheduled workflow fails, and disables
a scheduled workflow after 60 days of repository inactivity - re-enable it from
the Actions tab if that happens.

## 7. Rate limits

iRacing publishes a per-account budget in `x-ratelimit-remaining` /
`x-ratelimit-reset` and answers `429` when it is spent. The script reads those
headers, pauses when the budget runs low, backs off and retries a `429` up to
three times, and waits ~0.6s between drivers. One nightly run costs roughly
`2 x drivers + 1` calls (plus one login), which is far inside the limits for a
roster this size; a roster in the hundreds would need batching instead.

Also worth knowing: `/data` endpoints do not return the payload directly. They
return a small `{ "link": ... }` pointing at a pre-signed S3 URL that holds the
real JSON, and the script follows it automatically (once, per call).

## 8. iRacing's terms

The data API is licensed for **personal, non-commercial use**. What we do here
fits that: we read our own drivers' public licence and results data and show it
on the team page.

- Do not redistribute raw API data, do not republish a bulk dump of it, and do
  not build a paid product on it.
- Do not point the sync at drivers who are not on the team.
- Keep the request volume low (see above); iRacing can and does cut off accounts
  that hammer the API.
- iRacing can change or withdraw the API at any time. If it does, delete the
  workflow and the file - the site keeps working.
