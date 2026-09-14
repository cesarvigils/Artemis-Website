# sample-data

Copies of the three website data files, converted to the shape of the data
contract (version 1) and given ids. They exist so the bot can be run and tested
without touching the website repository.

Every record carries `"_placeholder": true`, because these are the sample
records shipped with the redesign rather than real team data. `/data placeholders`
lists them, and the list embeds mark them with "(placeholder)".

## Using them

    STORAGE=local DATA_DIR=./sample-data npm start

On Windows PowerShell:

    $env:STORAGE="local"; $env:DATA_DIR="./sample-data"; npm start

Or put the two lines in `.env`:

    STORAGE=local
    DATA_DIR=./sample-data

In local mode the bot writes straight to these files. Nothing is pushed, no
commit is made, and the confirmation embed says so instead of promising a
deployment. The check command reads them without logging in to Discord:

    STORAGE=local DATA_DIR=./sample-data npm run check

To keep a scratch copy that git ignores, name it `*.local.json`, for example
`results.local.json`.

## How they differ from the files currently on the website

The website files predate the contract, so the conversion changed four things.
The same changes have to happen once in the website repository before the bot
writes to it:

| Was | Now | Why |
|---|---|---|
| no `id` | `id` on every record | the contract needs a stable key to edit and remove by |
| results `driver: "A / B / C"` | `drivers: ["A", "B", "C"]` | the contract stores a list, and the site matches the names against `drivers.json` |
| classes `NASCAR Class B`, `Trucks` | `NASCAR Xfinity`, `NASCAR Trucks` | those two spellings are not in the contract class list |
| events `date` + `endDate` + timed `start` | `start` + optional `end`, dates only | the contract stores plain dates, no times |
| events `status: "entered"` | `status: "confirmed"` | `entered` is not one of the four contract statuses |
| drivers had no `role` or `active` | `role` and `active` on every record | both are contract fields; crew were split into `pitwall` and `staff` by their focus |

The surnames used in the old `driver` strings were expanded to the full names in
`drivers.json`, so the site can match a result to a driver.

The optional results field `entries` is not set on any sample record, because
the original data did not record how many cars were in each class. Add it with
`/result edit id:<id> entries:<number>` to see the site render "P4 / 41".
