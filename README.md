# Artemis data bot

A Discord bot that lets team staff edit the website's race results, driver
roster and event calendar with slash commands. Each command writes one commit to
the website repository, Vercel rebuilds, and the change is live in about a
minute.

It manages three files in `cesarvigils/Artemis-Website`:

| File | Command | What the website does with it |
|---|---|---|
| `src/data/results.json` | `/result` | home page "Recent results", the hero proof row, the partners page snapshot |
| `src/data/drivers.json` | `/driver` | home page "Who drives", the team page |
| `src/data/events.json` | `/event` | the "Next race" strip and its countdown |

`/data` reports on all three without changing anything.

There is a fourth file, `src/data/stats.json`, but the bot does not manage it:
it is generated nightly by a separate iRacing sync job. `/data status` shows a
one line summary of it when it exists; `/data validate` never checks it, and
the bot never writes it. See `docs/data-contract.md` for the full shape.

Two fields added in data contract version 1.2 are worth knowing about: a
driver's `iracingId` (`/driver add` and `/driver edit`, option `iracingid`)
links that driver to the nightly sync above, and an event's `startTime`
(`/event add` and `/event edit`, option `starttime`) is the green flag time,
entered as `HH:MM` UTC or a full ISO UTC timestamp. Both are optional.

`SPEC.md` is the full command reference: every option, the embed layouts, the
permission model and the write protocol. This file is the setup guide.

## What you need before you start

- Node 22 or newer (`node --version`). The repository pins 22 in `.nvmrc`.
- Manage Server permission in the Discord server.
- Permission to create a fine-grained token on the GitHub account that owns the
  website repository.

## 1. Create the Discord application and bot user

1. Open <https://discord.com/developers/applications> and choose
   **New Application**. Name it "Artemis data bot".
2. On **General Information**, copy the **Application Id**. That is
   `DISCORD_CLIENT_ID`.
3. Open the **Bot** page and choose **Reset Token**, then copy the token. That is
   `DISCORD_TOKEN`. It is shown once; if you lose it, reset it again.
4. On the same page leave all three **Privileged Gateway Intents** switched off.
   The bot does not read messages or member lists, so it does not need them.
   Leaving them off also means the bot never needs Discord verification.

## 2. Invite the bot to the server

Use this URL, with your own Application Id in place of `CLIENT_ID`:

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=19456&scope=bot%20applications.commands
```

- Scopes: `bot` and `applications.commands`. Both are required; without the
  second one the slash commands cannot be registered.
- Permission integer `19456` is the minimum the bot needs: View Channel (1024),
  Send Messages (2048) and Embed Links (16384). Nothing else is requested.

The bot only needs those permissions in the channel where staff run commands,
and in the audit channel if you set one.

## 3. Find the server and channel ids

In Discord, open **User Settings, Advanced** and turn on **Developer Mode**.
Then right click the server name and choose **Copy Server Id**: that is
`DISCORD_GUILD_ID`. Right click a channel and choose **Copy Channel Id** for the
optional `LOG_CHANNEL_ID` (the audit channel, ephemeral-style compact embeds)
and the optional `RESULTS_CHANNEL_ID` (a public channel where `/result add`
posts an announcement of the new result; see SPEC.md for the layout). Both can
be the same channel, different channels, or left empty.

## 4. Create the GitHub token

1. Open <https://github.com/settings/personal-access-tokens> and choose
   **Generate new token**, the fine-grained kind.
2. Resource owner: the account that owns `cesarvigils/Artemis-Website`.
3. Repository access: **Only select repositories**, and pick
   `cesarvigils/Artemis-Website`.
4. Repository permissions: set **Contents** to **Read and write**. Leave every
   other permission at No access.
5. Set an expiry you can live with, generate the token and copy it. That is
   `GITHUB_TOKEN`.

A fine-grained token that cannot see the repository reports 404 rather than 403,
so if the bot says "Not found on GitHub", check the repository list on the token
first.

## 5. Fill in the configuration

```bash
cp .env.example .env
```

Then edit `.env`. Every variable is listed there with a one line comment. The
ones you must set:

| Variable | Value |
|---|---|
| `DISCORD_TOKEN` | the bot token from step 1 |
| `DISCORD_CLIENT_ID` | the Application Id from step 1 |
| `DISCORD_GUILD_ID` | the server id from step 3 |
| `GITHUB_TOKEN` | the token from step 4 |
| `GITHUB_OWNER` | `cesarvigils` |
| `GITHUB_REPO` | `Artemis-Website` |
| `GITHUB_BRANCH` | the branch Vercel deploys: `maintenance` for production |
| `DATA_DIR` | `src/data` |

`.env` is in `.gitignore`. Never commit it, and never paste a token into
Discord. The bot redacts anything token shaped from its own log.

## 6. Install, check, register, start

```bash
npm install
npm run check      # validates the configuration and the three data files
npm run register   # tells Discord about the commands, instant in your server
npm start
```

`npm run check` does not log in to Discord, so it is the fastest way to see
whether the configuration is right. When the bot starts you should see
`Logged in as ...` followed by the data source.

Run `npm run register` again whenever an option or description changes.
`npm run register:dry` prints the command JSON without contacting Discord. The
JSON is the only thing on stdout, so `npm run --silent register:dry > commands.json`
gives a file you can inspect; npm's own banner is what `--silent` removes.

## Trying it without touching the website

`sample-data/` holds the three files converted to the contract shape. Point the
bot at them to experiment:

```bash
STORAGE=local DATA_DIR=./sample-data npm start
```

In local mode the bot writes to those files on disk, makes no commit and says so
in its replies. See `sample-data/README.md`.

## How a change reaches the website

1. A member with Manage Server runs, for example,
   `/result add date:2026-09-06 event:Suzuka 1000 ...`.
2. The bot reads `src/data/results.json` from GitHub with its sha, adds the
   record, re-sorts the file and writes it back as one commit, authored by
   `Artemis Data Bot <bot@artemisesports.com>`.
3. The push to the deployed branch starts a Vercel build. The website reads the
   JSON at build time.
4. The site is live with the change in about a minute. The reply says so.

If the data were ever invalid, the website's own `npm run check:data` fails the
build and Vercel keeps the previous deployment. The bot validates before it
writes, so that should not happen.

## Running it 24/7

The bot is a small long running process. Any host that runs Node 22 works.

With [pm2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start src/index.js --name artemis-data-bot
pm2 save
pm2 startup          # prints the command that starts pm2 at boot
pm2 logs artemis-data-bot
```

With systemd, a unit that runs `node /path/to/bot/src/index.js` with
`Restart=always` is enough. The bot handles SIGTERM, so `systemctl stop` and
`pm2 stop` shut it down cleanly.

Free tier notes:

- A small always-on VM (Oracle Cloud free tier, or any low cost VPS) is the
  simplest option, because the bot needs a process that stays running.
- Free web hosts that sleep when no HTTP request arrives (the Render and Fly
  free plans, for example) will disconnect the bot. If you use one, pick a plan
  that does not sleep. A "background worker" plan is the right shape.
- Serverless hosting, including Vercel, cannot run this bot: it holds an open
  gateway connection rather than answering HTTP requests. `vercel.json` in this
  folder switches Vercel deployments off for the `bot` branch, so the branch
  never starts a build.

## Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| Commands do not appear in Discord | They were never registered, or were registered for another server | Run `npm run register`, then fully reload the Discord client with Ctrl+R |
| "You need the Manage Server permission" | The account lacks it, or a server override granted the command to someone else | Give the person Manage Server, or leave it as it is |
| Registration fails with 401 | `DISCORD_TOKEN` is wrong or was reset | Reset the token on the Bot page and update `.env` |
| Registration fails with 404 | `DISCORD_CLIENT_ID` or `DISCORD_GUILD_ID` is wrong, or the bot is not in the server | Check both ids, and re-invite with the URL in step 2 |
| "GitHub authentication failed" | `GITHUB_TOKEN` is missing, mistyped or expired | Create a new fine-grained token and update `.env` |
| "Not found on GitHub" | Wrong owner, repository, branch or `DATA_DIR`, or the token cannot see the repository | Check `GITHUB_*` and `DATA_DIR`, then the token's repository list |
| "GitHub permission denied" | The token has Contents read only | Set Contents to Read and write |
| "Existing data is invalid" | Someone hand edited a file into a shape the contract rejects | Run `/data validate`, fix the named records in GitHub, try again |
| "Write conflict" | The file changed twice while the command ran | Wait a moment and run the command again |
| "Confirmation expired" | The Confirm button was not pressed within 60 seconds | Run the remove command again |
| The change is not on the site | The Vercel build is still running, or it failed | Check the Vercel dashboard for the branch in `GITHUB_BRANCH` |
| Ids do not autocomplete | The bot cannot read the file, or the list is still cached | Run `/data status`; suggestions refresh at most every 30 seconds |

## Development

```bash
npm run dev           # restarts on file changes
npm test              # node --test, no test framework
npm run register:dry  # prints the command JSON
```

Layout:

```
src/index.js             the bot process, routing and shutdown
src/register-commands.js registers the commands with Discord
src/commands/            one module per command, plus shared plumbing
src/lib/                 configuration, storage, validation, embeds, logging
sample-data/             the three files for local testing
test/                    node --test suites
SPEC.md                  command reference and layouts
```

## Dependencies

Two, both needed:

- `discord.js` v14, the Discord gateway and REST client.
- `dotenv`, to read `.env` in development.

Everything else uses what Node ships with: the built-in `fetch` talks to the
GitHub Contents API, and `node --test` runs the tests. There is no Octokit and
no test framework.
