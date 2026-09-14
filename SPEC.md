# Artemis data bot specification

What every command does, what the replies look like, who may run them, how
failures are reported, and how a change reaches the repository. The data shapes
come from the Artemis data contract, version 1.2 (14 September 2026); the
section "What the website does with each field" at the end restates the parts
of it the operator needs.

`README.md` is the setup guide. This file is the reference.

## Contents

- [Permission model](#permission-model)
- [Commands](#commands)
  - [/result](#result)
  - [/driver](#driver)
  - [/event](#event)
  - [/data](#data)
- [Shared behaviour](#shared-behaviour)
- [Embed layouts](#embed-layouts)
- [Error handling](#error-handling)
- [Write protocol](#write-protocol)
- [What the website does with each field](#what-the-website-does-with-each-field)

## Permission model

Only members with the Discord **Manage Server** permission may use any command.
It is enforced twice, because either layer alone can be worked around:

1. **At registration.** Every command is built with
   `setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)` (the integer
   `32`) and `setDMPermission(false)`. Discord hides the commands from everyone
   else and refuses them in direct messages.
2. **At run time.** Every command checks
   `interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)` before
   doing any work. A server administrator can override the default in Server
   Settings, so the default alone is not a guarantee. Autocomplete is checked
   the same way and answers with an empty list.

A refused command replies, only to the person who ran it:

```
Not allowed
You need the Manage Server permission to use this command.

- Ask a server administrator if you should have it.
                                              Artemis data bot
```

Every reply the bot sends is ephemeral: only the person who ran the command sees
it. The team's shared record of changes is the optional audit channel
(`LOG_CHANNEL_ID`), which gets one compact embed per change.

## Commands

Option types are the Discord types. "Required" means Discord will not let the
command be sent without it.

### /result

Manages `src/data/results.json`.

#### /result add

| Option | Type | Required | Rules |
|---|---|---|---|
| `date` | string | yes | `YYYY-MM-DD`. Slashes and dots are accepted and rewritten. Not more than one day in the future |
| `event` | string | yes | 2 to 80 characters |
| `track` | string | yes | 2 to 80 characters |
| `series` | string | yes | 2 to 60 characters, a league name or `iRacing Special Event` |
| `class` | string | yes | choice: `GTP`, `LMP2`, `GT3`, `GT4`, `TCR`, `NASCAR Cup`, `NASCAR Xfinity`, `NASCAR Trucks`, `ARCA`, `Formula`, `Other` |
| `position` | integer | yes | 1 to 99 |
| `drivers` | string | yes | 1 to 6 names separated by commas, each 2 to 40 characters, kept in the order typed |
| `entries` | integer | no | 2 to 999, the number of cars in the class or split. Must not be smaller than `position` |
| `note` | string | no | up to 140 characters |
| `id` | string | no | slugged before use. Left empty, the id is `<date>-<slug(event)>-<slug(class)>` |

#### /result edit

`id` is required and offers autocomplete. Every other option is optional, and
only the options actually supplied are changed.

| Option | Type | Rules |
|---|---|---|
| `id` | string | required, autocomplete, the record to change |
| `date`, `event`, `track`, `series`, `class`, `position`, `drivers`, `entries`, `note` | as in add | replace the stored value |
| `clear` | string | choice: `note`, `entries`. Empties one optional field |

`drivers` replaces the whole list rather than adding to it. A single hyphen in
`note` clears it, the same as `clear:note`. An id can never be edited: remove the
record and add it again.

#### /result remove

| Option | Type | Required | Rules |
|---|---|---|---|
| `id` | string | yes | autocomplete, the record to remove |

Shows the record and a Confirm / Cancel button pair. Nothing is written until
Confirm is pressed.

#### /result list

| Option | Type | Required | Rules |
|---|---|---|---|
| `page` | integer | no | from 1, defaults to 1. Ten records to a page |

Newest first, the same order as the file.

#### Results announcement

When the optional `RESULTS_CHANNEL_ID` environment variable is set, `/result
add` (only add, never edit or remove) also posts a public embed to that
channel: not ephemeral, visible to the whole channel. It follows the brand's
locked template and is built by a separate function from every other embed in
the bot (`resultAnnouncementEmbed` in `src/lib/embeds.js`), with its own
footer, `The Scoreboard`, rather than `Artemis data bot`. No emojis, no
exclamation marks, and the bot never adds an adjective of its own: only the
record's own values, and the operator's own `note` when one was typed.

```
P4 of 41 - Suzuka 1000
Suzuka International Racing Course | GT3 | 2026-09-06
Two stops on strategy, no contact all race.
Drivers: Matthew Blackley, Nolan Walker
                                              The Scoreboard
```

The title is `P<position> - <event>`, with ` of <entries>` inserted after the
position when `entries` is set on the record. The second line always carries
track, class and date, in that order, separated by ` | `. The `note` appears
as its own line only when the record has one; it is shown exactly as typed,
the "factual detail" of the result, never rephrased or embellished. The
drivers line always appears, in the order they were entered.

If the channel cannot be reached (wrong id, the bot lacks access, a network
error), the failure is logged as a warning and never fails the command: the
result is still saved, and the normal ephemeral confirmation gets one extra
line saying the public channel could not be reached.

### /driver

Manages `src/data/drivers.json`.

#### /driver add

| Option | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 2 to 40 characters, a real name or a handle |
| `role` | string | yes | choice: `driver`, `pitwall`, `staff` |
| `group` | string | yes | choice: `road`, `oval`, `crew`. Use `crew` for pitwall and staff |
| `country` | string | yes | three letter code, stored uppercase, for example `USA`, `GBR`, `NLD` |
| `focus` | string | yes | 2 to 40 characters, for example `GT3 / Endurance` or `Strategy` |
| `number` | string | no | 1 to 3 digits. A leading `#` and leading zeros are accepted. Required for `road` and `oval`, empty for `crew` |
| `bio` | string | no | up to 140 characters |
| `irating` | integer | no | 0 to 15000, stored under `stats.irating` |
| `licence` | string | no | `A 4.20` shape, stored uppercase under `stats.licence` |
| `iracingid` | integer | no | 1 to 99999999, stored as `iracingId`. The driver's iRacing customer id; when set, the nightly iRacing sync fills `stats.json` for this driver |
| `x`, `twitch`, `youtube`, `instagram` | string | no | full `https` links, stored under `socials` |
| `active` | boolean | no | defaults to yes. Inactive people stay in the file but are hidden on the site |
| `id` | string | no | left empty, the id is `slug(name)` |

`stats` and `socials` are only written when at least one of their values is
supplied, so a record stays as small as the site needs. `iracingId` is written
only when supplied.

#### /driver edit

`id` is required and offers autocomplete; every other option is optional.

| Option | Type | Rules |
|---|---|---|
| `id` | string | required, autocomplete |
| `name`, `role`, `group`, `country`, `focus`, `number`, `bio`, `irating`, `licence`, `iracingid`, `x`, `twitch`, `youtube`, `instagram`, `active` | as in add | replace the stored value |
| `clear` | string | choice: `bio`, `number`, `irating`, `licence`, `iracingid`, `x`, `twitch`, `youtube`, `instagram` |

A single hyphen clears `bio`, `number`, `licence` and any of the four links.
`irating` and `iracingid` are numbers, so each can only be cleared with
`clear:irating` or `clear:iracingid`; a hyphen has no effect on a number
option.

#### /driver remove, /driver list

Same shape as `/result remove` and `/result list`. The list is ordered road,
then oval, then crew, by car number, and crew by name.

### /event

Manages `src/data/events.json`.

#### /event add

| Option | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 2 to 80 characters |
| `track` | string | yes | 2 to 80 characters |
| `start` | string | yes | `YYYY-MM-DD`, the first day |
| `classes` | string | yes | 1 to 4 classes separated by commas, from the `/result` class list. Matched without case |
| `status` | string | yes | choice: `planned`, `confirmed`, `done`, `skipped` |
| `end` | string | no | `YYYY-MM-DD`, not earlier than `start`. Leave empty for a one day event |
| `starttime` | string | no | `HH:MM`, treated as UTC on the `start` date, or a full ISO 8601 UTC timestamp such as `2026-09-25T14:00:00Z` whose date part equals `start`. Anything else is refused. Stored as `startTime` |
| `note` | string | no | up to 140 characters |
| `id` | string | no | left empty, the id is `<start>-<slug(name)>` |

#### /event edit

`id` is required and offers autocomplete; every other option is optional. A
single hyphen clears `end`, `starttime` or `note`. Editing `start` alone is
still checked against the stored `end` and, when one is stored, the stored
`starttime`: if the new `start` no longer matches `startTime`'s date part, the
edit is refused. Set a new `starttime` in the same command to move both
together.

#### /event remove, /event list

Same shape as `/result remove` and `/result list`. The list is ordered by start
date, earliest first.

### /data

Read only. None of these change anything.

| Subcommand | Options | What it shows |
|---|---|---|
| `/data status` | none | storage mode, repository, branch, folder, record count per file, the last commit that touched the data folder with its short sha and date, a summary of `stats.json` when it is present (its `updated` value and how many drivers it covers), and whether an audit channel is set |
| `/data validate` | none | every file checked against the contract; lists up to 20 problems as `file[index].field: message`. `stats.json` is never checked: it is not managed by the bot |
| `/data placeholders` | none | the records still marked `_placeholder`, per file, with their ids so they can be removed |

`stats.json` is a fourth file the website reads, generated nightly by a
separate iRacing sync job outside this bot (see `docs/data-contract.md`,
version 1.2). The bot only ever reads a summary of it for `/data status`; it
is never validated and never written here. A missing or malformed
`stats.json` is reported plainly in `/data status` and never fails the
command.

## Shared behaviour

**Autocomplete.** The `id` option of every edit and remove reads the current
file and suggests matching records, showing a readable label rather than a bare
id. Discord allows three seconds and at most 25 choices, so the parsed file is
cached for at most 30 seconds and the list is cut to 25. Writes never use the
cache: every write re-reads the file first, and a successful write clears the
cache immediately. Invalid records still appear, so a broken record can be
selected and fixed.

**Comma separated lists.** `drivers` and `classes` are split on commas and
trimmed, runs of spaces inside a value are collapsed, and empty entries are
dropped, so `"Solo Driver,,  "` is one name. A repeated entry is refused.

**Clearing a field.** Discord cannot send "no value" for an option, so a single
hyphen clears an optional text field, and the `clear` option covers the rest.
Cleared fields are removed from the record rather than written as empty, except
a driver `number`, which the contract stores as an empty string for crew.

**Unknown fields.** A field a human added by hand that the contract does not
mention is carried through an edit untouched, and written after the known
fields.

**Ids are immutable.** Editing an id is not offered. Remove the record and add
it again.

## Embed layouts

Every embed has a title, labelled fields and the footer `Artemis data bot`. The
colour is the team teal `0x0fffcf`, except errors, which are red. No emojis
anywhere, and no exclamation marks. The one exception is the results
announcement (see "Results announcement" above), a plain public message with
its own footer, `The Scoreboard`.

A driver embed and list line show `iRacing id` only when the record has an
`iracingId`; an event embed and list line show `Start time` only when the
record has a `startTime`. Every other field is always shown, "not set" when
empty.

### After add or edit

```
Result added
The result was written to results.json.
Live in about a minute once Vercel finishes building.

Id            2026-09-06-suzuka-1000-gt3
Date          2026-09-06     Position  P4 / 41    Entries  41
Class         GT3
Event         Suzuka 1000
Track         Suzuka International Racing Course
Series        iRacing Special Event
Drivers       Matthew Blackley, Nolan Walker
Note          Two stops on strategy, no contact all race.
File          results.json (7 record(s))    Commit  a1b2c3d
                                              Artemis data bot
```

An edit adds the list of fields that changed to the line under the title:
`Updated in results.json. Fields changed: position, note.`

### Remove, before and after

```
Remove this result
This cannot be undone from Discord. Choose Confirm to write the change,
or Cancel to stop.

Id            2026-09-06-suzuka-1000-gt3
... the same fields as above ...
                                              Artemis data bot
[ Confirm ]  [ Cancel ]
```

Confirm is a red button, Cancel is grey. They are live for 60 seconds and only
answer the person who ran the command. After 60 seconds the buttons disappear
and the embed reads "Confirmation expired. Nothing was changed." Cancel gives
"Cancelled. Nothing was changed." Confirm writes the change and replies:

```
Removed a result
Record "2026-09-06-suzuka-1000-gt3" was removed from results.json.
Live in about a minute once Vercel finishes building.

File          results.json (6 record(s))    Commit  a1b2c3d
                                              Artemis data bot
```

### List

Ten records to a page, one block per record, numbered from the top of the file.

```
Result list
results.json, 14 record(s)
Page 1 of 2

1. 2026-09-06 | P4 / 41 | GT3 | Suzuka 1000 | Suzuka International Racing Course
   id: 2026-09-06-suzuka-1000-gt3

2. 2026-08-14 | P4 | NASCAR Xfinity | Friday Night Lights, round 9 | Bristol Motor Speedway (placeholder)
   id: 2026-08-14-friday-night-lights-round-9-nascar-xfinity

...

Source        cesarvigils/Artemis-Website on branch master, folder src/data
                                              Artemis data bot
```

Driver lines read `name | no 14 | road | driver | GT3 / Endurance | active`, and
event lines read `2026-09-25 to 2026-09-27 | confirmed | Petit Le Mans | Road
Atlanta | GTP, LMP2, GT3`. A record marked `_placeholder` ends with
"(placeholder)". If the file holds records that do not match the contract, a
Warning field is added telling the operator to run `/data validate`.

### Error

```
Invalid input
The entries option cannot be smaller than the finishing position, which is 41.

- Allowed classes: GTP, LMP2, GT3, GT4, TCR, NASCAR Cup, ...
                                              Artemis data bot
```

### Audit channel

One embed per change, posted in `LOG_CHANNEL_ID` when it is set:

```
Data change
Change    add in results.json    Record  2026-09-06-suzuka-1000-gt3
By        nina (123456789012345678)
Summary   The result was written to results.json.
Commit    a1b2c3d - https://github.com/.../commit/a1b2c3d...
                                              Artemis data bot
```

A failure to post there is logged and never affects the command.

## Error handling

Problems an operator can fix are shown as written, in a red embed with a title,
the sentence, and any extra lines as a bulleted list. Everything else is a bug:
the operator sees "Something went wrong. The command could not be finished. The
details were written to the bot log." and the full stack goes to the log. A
failing command never takes the bot down.

| Situation | Title | What the bot does |
|---|---|---|
| Caller lacks Manage Server | Not allowed | refuses before doing any work |
| An option value breaks a rule | Invalid input | names the option and the rule, nothing is read or written |
| `id` does not exist | Record not found | suggests the list subcommand |
| Edit with no fields supplied | Nothing to do | asks for at least one option |
| The stored file already breaks the contract | Existing data is invalid | lists up to 8 problems, refuses to write, points at `/data validate` |
| The change would break the contract | Change refused | lists the problems, nothing is written |
| The file changed during the command | Write conflict | re-reads and retries once, then reports it |
| Token rejected | GitHub authentication failed | says which variable to fix |
| Token cannot write | GitHub permission denied | says to set Contents to Read and write |
| Wrong owner, repo, branch or folder | Not found on GitHub | prints what was checked |
| GitHub unreachable or slow | Network error | asks to try again; requests time out after 15 seconds |
| Confirm not pressed in 60 seconds | Confirmation expired | nothing is written |

Startup is separate: a missing or malformed variable stops the process before it
logs in, printing every problem at once with the variable name and what to do.

## Write protocol

Exactly the protocol in the data contract. One command, one commit.

1. **Read.** GET the file through the GitHub Contents API on `GITHUB_BRANCH`,
   keeping its blob `sha`. Parse it, then validate the whole array. If the file
   already breaks the contract, the command stops and names the records; nothing
   is written on top of a broken file.
2. **Change.** Apply the edit to a copy, validate the result, re-sort, and
   serialise: `JSON.stringify(records, null, 2)` plus a trailing newline, LF
   endings, keys in contract order, unknown keys kept at the end.
3. **Write.** PUT with the previous `sha` and the branch. Author and committer
   are `Artemis Data Bot <bot@artemisesports.com>`. The message is
   `data(<file>): <add|edit|remove> <id> (by <discord username> <discord user id>)`,
   for example
   `data(results.json): add 2026-09-06-suzuka-1000-gt3 (by nina 123456789012345678)`.
4. **Conflict.** A 409 or 422 means someone else changed the file first. The bot
   reads again, reapplies the change and retries once. A second conflict is
   reported and nothing is written.
5. **Reply.** An embed with what changed, the record, the short commit sha and
   "Live in about a minute once Vercel finishes building."

Nothing is cached between commands, so a hand edit made in GitHub is never
silently overwritten. The only cache is the 30 second one behind autocomplete,
which is never used to build a write.

With `STORAGE=local` the same cycle runs against files on disk. The "sha" is
then a hash of the file content, so a file changed underneath the bot is
detected the same way, and the reply says that nothing was pushed.

## What the website does with each field

From the data contract. Sort order is applied by the bot on every write; a file
that arrives unsorted is still accepted.

### results.json, sorted by `date` descending then `position` ascending

| Field | Type | Rules |
|---|---|---|
| `id` | string | lowercase slug, 3 to 80 characters, unique in the file. Default `<date>-<slug(event)>-<slug(class)>`, then `-2`, `-3` if taken |
| `date` | string | ISO date, not more than one day in the future |
| `event` | string | 2 to 80 characters |
| `track` | string | 2 to 80 characters |
| `series` | string | 2 to 60 characters |
| `class` | string | one of the eleven class values |
| `position` | integer | 1 to 99 |
| `entries` | integer | optional, 2 to 999: cars in the class or split, so the site can show `P4 / 41` |
| `drivers` | string[] | 1 to 6 names, each 2 to 40 characters, shown in order. The site matches these names against `drivers.json` `name` to show each driver's latest finish |
| `note` | string | optional, up to 140 characters |

Site usage: the home page "Recent results" shows the first 6 records; the hero
proof row is the record with the lowest `position` among the newest 3 by date,
ties going to the newest; the partners page snapshot shows the first 3.

### drivers.json, sorted by group road, oval, crew, then by number, crew by name

| Field | Type | Rules |
|---|---|---|
| `id` | string | default `slug(name)` |
| `name` | string | 2 to 40 characters |
| `role` | string | `driver`, `pitwall` or `staff` |
| `group` | string | `road`, `oval` or `crew`, with `crew` for pitwall and staff |
| `number` | string | 1 to 3 digits, or empty for crew |
| `country` | string | ISO 3166-1 alpha-3, uppercase |
| `focus` | string | 2 to 40 characters |
| `bio` | string | up to 140 characters, may be empty |
| `stats.irating` | integer | optional, 0 to 15000 |
| `stats.licence` | string | optional, `A 4.20` shape |
| `socials.*` | string | optional https links; keys `x`, `twitch`, `youtube`, `instagram` |
| `active` | boolean | defaults to true; inactive people are hidden on the site but kept in the file |
| `iracingId` | integer | optional, 1 to 99999999: the driver's iRacing customer id. When present, the nightly iRacing sync fills `stats.json` for this driver; when absent, the site shows only what is in `stats` above |

Site usage: the home page "Who drives" shows the first 4 active records with
`role: driver`; the team page shows all active records grouped by `group`;
`stats` is rendered only when it is present.

### events.json, sorted by `start` ascending

| Field | Type | Rules |
|---|---|---|
| `id` | string | default `<start>-<slug(name)>` |
| `name` | string | 2 to 80 characters |
| `track` | string | 2 to 80 characters |
| `start` | string | ISO date |
| `end` | string | optional ISO date, not earlier than `start` |
| `startTime` | string | optional ISO 8601 UTC timestamp on the `start` date, for example `2026-09-25T14:00:00Z`. The site converts it to the visitor's local time and uses it for the countdown; without it the countdown targets 00:00 America/Chicago as before |
| `classes` | string[] | 1 to 4 values from the class list |
| `status` | string | `planned`, `confirmed`, `done` or `skipped` |
| `note` | string | optional, up to 140 characters |

Site usage: the "Next race" strip is the first event whose `end` (or `start`) is
today or later and whose status is `planned` or `confirmed`. If there is none,
the strip reads "No race scheduled" with the last `done` event as a subtitle.
The countdown targets `start` at 00:00 in the site's timezone,
America/Chicago, or `startTime` when the event has one.

### stats.json, generated by the nightly iRacing sync, not managed by this bot

`src/data/stats.json`, written by `scripts/fetch-iracing.mjs` from a GitHub
Action, not by this bot. The bot never validates it and never writes it;
`/data status` shows its `updated` value and how many drivers it covers, when
the file is present. See `docs/data-contract.md` for the full shape.

### Rules that apply to all three

- Files are UTF-8 JSON arrays, 2 space indent, LF endings, a trailing newline.
- Dates are `YYYY-MM-DD` strings with no times.
- Strings are trimmed, and empty strings are only allowed where the table says
  so.
- `_placeholder: true` marks sample data shipped with the preview. The site
  renders those records like any other; the bot marks them "(placeholder)" in
  lists and gathers them under `/data placeholders`. Records the bot writes
  never carry the field.
- Fields the contract does not mention are preserved by the bot and ignored by
  the site.
