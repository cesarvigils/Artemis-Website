/**
 * Differential test: the bot's validator against the website's build check.
 *
 * The two are separate implementations of one data contract. The bot's
 * src/lib/validate.js decides what it will commit; the website's
 * scripts/check-data.mjs decides what will build. When they disagree and the
 * bot is the looser of the two, the bot commits a file that cannot be deployed,
 * tells the operator the change is live, and the site quietly keeps serving the
 * previous version. That is not hypothetical: duplicate iracingId, unknown
 * socials keys and a position worse than the field size had all drifted apart
 * before this test existed.
 *
 * Every case below is run through both, and the two have to agree on pass or
 * fail. What they say about it is their own business; only the verdict matters.
 *
 * The website's script lives on another branch, so it is supplied by path:
 *
 *   git show origin/master:scripts/check-data.mjs > /tmp/check-data.mjs
 *   WEBSITE_CHECK_DATA=/tmp/check-data.mjs npm test
 *
 * Without it the suite skips, so `npm test` still works offline. CI always sets
 * it: see .github/workflows/ci.yml.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { validateAll } from '../src/lib/validate.js';

const run = promisify(execFile);
const checkDataPath = process.env.WEBSITE_CHECK_DATA;

/* Baseline: one valid record per file. Every case is a small edit of this. */

const baseline = () => ({
  results: [
    {
      id: '2026-09-06-suzuka-1000-gt3',
      date: '2026-09-06',
      event: 'Suzuka 1000',
      track: 'Suzuka International Racing Course',
      series: 'iRacing Special Event',
      class: 'GT3',
      position: 4,
      entries: 41,
      drivers: ['Matthew Blackley', 'Nolan Walker'],
      note: 'Two stops on strategy, no contact all race.',
    },
  ],
  drivers: [
    {
      id: 'matthew-blackley',
      name: 'Matthew Blackley',
      role: 'driver',
      group: 'road',
      number: '14',
      country: 'USA',
      focus: 'GT3 / Endurance',
      bio: 'One line, plain.',
      stats: { irating: 5012, licence: 'A 4.20' },
      socials: { x: 'https://x.com/example' },
      active: true,
      iracingId: 123456,
    },
    {
      id: 'nolan-walker',
      name: 'Nolan Walker',
      role: 'driver',
      group: 'oval',
      number: '22',
      country: 'USA',
      focus: 'NASCAR Cup',
      active: true,
    },
    {
      id: 'sam-oduya',
      name: 'Sam Oduya',
      role: 'pitwall',
      group: 'crew',
      number: '',
      country: 'GBR',
      focus: 'Strategy',
      active: true,
    },
  ],
  events: [
    {
      id: '2026-09-25-petit-le-mans',
      name: 'Petit Le Mans',
      track: 'Michelin Raceway Road Atlanta',
      start: '2026-09-25',
      end: '2026-09-27',
      startTime: '2026-09-25T15:15:00Z',
      classes: ['GTP', 'LMP2', 'GT3'],
      status: 'confirmed',
    },
  ],
});

/**
 * Build one case by editing the baseline.
 * @param {string} name
 * @param {(files: ReturnType<typeof baseline>) => void} mutate
 * @param {boolean} valid what both validators must say
 */
const withCase = (name, mutate, valid) => {
  const files = baseline();
  mutate(files);
  return { name, files, valid };
};

/** One case per contract rule, valid and invalid alike. */
const cases = [
  withCase('the baseline is valid', () => {}, true),
  withCase('empty files are valid', (files) => {
    files.results = [];
    files.drivers = [];
    files.events = [];
  }, true),

  /* results.json */
  withCase('result: duplicate id', (files) => {
    files.results.push({ ...files.results[0], position: 5 });
  }, false),
  withCase('result: id that is not a slug', (files) => {
    files.results[0].id = 'Not A Slug';
  }, false),
  withCase('result: impossible date', (files) => {
    files.results[0].date = '2026-02-30';
  }, false),
  withCase('result: date far in the future', (files) => {
    files.results[0].date = '2099-01-01';
  }, false),
  withCase('result: unknown class', (files) => {
    files.results[0].class = 'GT2';
  }, false),
  withCase('result: position out of range', (files) => {
    files.results[0].position = 0;
  }, false),
  withCase('result: position worse than the field size', (files) => {
    files.results[0].position = 42;
    files.results[0].entries = 41;
  }, false),
  withCase('result: position equal to the field size', (files) => {
    files.results[0].position = 41;
    files.results[0].entries = 41;
  }, true),
  withCase('result: entries below the minimum', (files) => {
    files.results[0].entries = 1;
  }, false),
  withCase('result: no drivers', (files) => {
    files.results[0].drivers = [];
  }, false),
  withCase('result: seven drivers', (files) => {
    files.results[0].drivers = ['A Name', 'B Name', 'C Name', 'D Name', 'E Name', 'F Name', 'G Name'];
  }, false),
  withCase('result: note over the limit', (files) => {
    files.results[0].note = 'x'.repeat(141);
  }, false),
  withCase('result: untrimmed text', (files) => {
    files.results[0].event = ' Suzuka 1000';
  }, false),
  withCase('result: no entries at all', (files) => {
    delete files.results[0].entries;
  }, true),

  /* drivers.json */
  withCase('driver: duplicate iRacing id', (files) => {
    files.drivers[1].iracingId = files.drivers[0].iracingId;
  }, false),
  withCase('driver: iRacing id out of range', (files) => {
    files.drivers[0].iracingId = 0;
  }, false),
  withCase('driver: unknown social channel', (files) => {
    files.drivers[0].socials.tiktok = 'https://tiktok.com/@example';
  }, false),
  withCase('driver: social link that is not https', (files) => {
    files.drivers[0].socials.x = 'http://x.com/example';
  }, false),
  withCase('driver: empty social link', (files) => {
    files.drivers[0].socials.x = '';
  }, true),
  withCase('driver: road driver with no number', (files) => {
    files.drivers[0].number = '';
  }, false),
  withCase('driver: crew member with no number', (files) => {
    files.drivers[2].number = '';
  }, true),
  withCase('driver: number that is not digits', (files) => {
    files.drivers[0].number = '14A';
  }, false),
  withCase('driver: country that is not alpha-3', (files) => {
    files.drivers[0].country = 'US';
  }, false),
  withCase('driver: unknown role', (files) => {
    files.drivers[0].role = 'engineer';
  }, false),
  withCase('driver: unknown group', (files) => {
    files.drivers[0].group = 'dirt';
  }, false),
  withCase('driver: licence in the wrong shape', (files) => {
    files.drivers[0].stats.licence = 'A4.20';
  }, false),
  withCase('driver: irating out of range', (files) => {
    files.drivers[0].stats.irating = 20000;
  }, false),
  withCase('driver: empty bio', (files) => {
    files.drivers[0].bio = '';
  }, true),
  withCase('driver: bio over the limit', (files) => {
    files.drivers[0].bio = 'x'.repeat(141);
  }, false),
  withCase('driver: active that is not a boolean', (files) => {
    files.drivers[0].active = 'yes';
  }, false),

  /* events.json */
  withCase('event: end before start', (files) => {
    files.events[0].end = '2026-09-24';
  }, false),
  withCase('event: startTime on another day', (files) => {
    files.events[0].startTime = '2026-09-26T15:15:00Z';
  }, false),
  withCase('event: startTime without seconds', (files) => {
    files.events[0].startTime = '2026-09-25T15:15Z';
  }, false),
  withCase('event: startTime with an offset instead of Z', (files) => {
    files.events[0].startTime = '2026-09-25T15:15:00+02:00';
  }, false),
  withCase('event: no startTime', (files) => {
    delete files.events[0].startTime;
  }, true),
  withCase('event: unknown status', (files) => {
    files.events[0].status = 'maybe';
  }, false),
  withCase('event: five classes', (files) => {
    files.events[0].classes = ['GTP', 'LMP2', 'GT3', 'GT4', 'TCR'];
  }, false),
  withCase('event: no classes', (files) => {
    files.events[0].classes = [];
  }, false),
  withCase('event: unknown class', (files) => {
    files.events[0].classes = ['GT2'];
  }, false),
];

/**
 * Run the website's check against one set of files, in a throwaway directory
 * laid out the way the script expects.
 *
 * @param {ReturnType<typeof baseline>} files
 * @returns {Promise<{ valid: boolean, output: string }>}
 */
async function runWebsiteCheck(files) {
  const root = mkdtempSync(join(tmpdir(), 'artemis-parity-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'src', 'data'), { recursive: true });
    copyFileSync(checkDataPath, join(root, 'scripts', 'check-data.mjs'));
    for (const [kind, records] of Object.entries(files)) {
      writeFileSync(join(root, 'src', 'data', `${kind}.json`), `${JSON.stringify(records, null, 2)}\n`, 'utf8');
    }
    // seats.json is hand-edited on the website and checked by the same script,
    // so it has to be present and valid or every case would fail for it.
    writeFileSync(
      join(root, 'src', 'data', 'seats.json'),
      `${JSON.stringify(
        [{ id: 'road-gt3-seat', program: 'road', role: 'GT3 endurance driver', status: 'open', requirements: ['A licence'] }],
        null,
        2,
      )}\n`,
      'utf8',
    );

    await run(process.execPath, [join(root, 'scripts', 'check-data.mjs')]);
    return { valid: true, output: '' };
  } catch (error) {
    if (typeof error.code === 'number') return { valid: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
    throw error;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const describe = checkDataPath && existsSync(checkDataPath) ? test : test.skip;

if (!checkDataPath) {
  test('the website check is not available, so parity was not verified', { skip: true }, () => {});
}

for (const testCase of cases) {
  describe(`bot and website agree: ${testCase.name}`, async () => {
    const bot = validateAll(testCase.files);
    const website = await runWebsiteCheck(testCase.files);

    assert.equal(
      bot.ok,
      testCase.valid,
      `the bot says ${bot.ok ? 'valid' : 'invalid'}: ${bot.errors.join('; ')}`,
    );
    assert.equal(
      website.valid,
      testCase.valid,
      `the website check says ${website.valid ? 'valid' : 'invalid'}: ${website.output}`,
    );
    assert.equal(
      bot.ok,
      website.valid,
      `the two validators disagree. Bot: ${bot.errors.join('; ') || 'valid'}. Website: ${website.output || 'valid'}`,
    );
  });
}
