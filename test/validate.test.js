/**
 * Tests for src/lib/validate.js: every record type, the optional fields, and
 * the whole file checks including id uniqueness.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isIsoDate,
  maxResultDate,
  validateAll,
  validateArray,
  validateDriver,
  validateEvent,
  validateResult,
} from '../src/lib/validate.js';

/** A result that satisfies the contract, used as the starting point below. */
const goodResult = () => ({
  id: '2026-09-06-suzuka-1000-gt3',
  date: '2026-09-06',
  event: 'Suzuka 1000',
  track: 'Suzuka International Racing Course',
  series: 'iRacing Special Event',
  class: 'GT3',
  position: 4,
  drivers: ['Matthew Blackley', 'Nolan Walker'],
  note: 'Two stops on strategy, no contact all race.',
});

/** A driver that satisfies the contract. */
const goodDriver = () => ({
  id: 'matthew-blackley',
  name: 'Matthew Blackley',
  role: 'driver',
  group: 'road',
  number: '14',
  country: 'USA',
  focus: 'GT3 / Endurance',
  bio: 'One line, plain.',
  stats: { irating: 5012, licence: 'A 4.20' },
  socials: { x: 'https://x.com/example', twitch: '', youtube: '', instagram: '' },
  active: true,
});

/** An event that satisfies the contract. */
const goodEvent = () => ({
  id: '2026-09-25-petit-le-mans',
  name: 'Petit Le Mans',
  track: 'Michelin Raceway Road Atlanta',
  start: '2026-09-25',
  end: '2026-09-27',
  classes: ['GTP', 'LMP2', 'GT3'],
  status: 'confirmed',
  note: 'Roster locks 19 Sep.',
});

/** A fixed clock so date rules do not depend on the day the tests run. */
const now = new Date('2026-09-14T12:00:00Z');

test('isIsoDate accepts real dates and rejects impossible ones', () => {
  assert.equal(isIsoDate('2026-09-06'), true);
  assert.equal(isIsoDate('2026-02-29'), false); // 2026 is not a leap year
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isIsoDate('2026-13-01'), false);
  assert.equal(isIsoDate('2026-9-6'), false);
  assert.equal(isIsoDate('06-09-2026'), false);
  assert.equal(isIsoDate(''), false);
  assert.equal(isIsoDate(20260906), false);
});

test('maxResultDate allows one day of slack', () => {
  assert.equal(maxResultDate(now), '2026-09-15');
});

test('a valid result passes', () => {
  assert.deepEqual(validateResult(goodResult(), { now }), []);
});

test('a result without a note passes', () => {
  const record = goodResult();
  delete record.note;
  assert.deepEqual(validateResult(record, { now }), []);
});

test('result errors name the file, index and field', () => {
  const record = goodResult();
  record.position = 0;
  const errors = validateResult(record, { now, prefix: 'results.json[3]' });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^results\.json\[3\]\.position: /);
});

test('result rejects a bad class, position, date and driver list', () => {
  const cases = [
    [{ class: 'Trucks' }, /\.class:/],
    [{ class: 'gt3' }, /\.class:/],
    [{ position: 100 }, /\.position:/],
    [{ position: 1.5 }, /\.position:/],
    [{ position: '4' }, /\.position:/],
    [{ date: '2026-09-31' }, /\.date:/],
    [{ date: '2026-09-20' }, /more than one day in the future/],
    [{ drivers: [] }, /\.drivers:/],
    [{ drivers: 'Solo Driver' }, /\.drivers:/],
    [{ drivers: ['A'] }, /\.drivers\[0\]:/],
    [{ drivers: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'] }, /\.drivers:/],
    [{ id: 'Has Capitals' }, /\.id:/],
    [{ id: 'ab' }, /\.id:/],
    [{ event: 'x' }, /\.event:/],
    [{ note: 'x'.repeat(141) }, /\.note:/],
    [{ series: ' padded ' }, /\.series:/],
  ];
  for (const [patch, pattern] of cases) {
    const record = { ...goodResult(), ...patch };
    const errors = validateResult(record, { now });
    assert.equal(errors.length > 0, true, `expected an error for ${JSON.stringify(patch)}`);
    assert.match(errors.join('\n'), pattern);
  }
});

test('result entries is optional and bounded', () => {
  const record = goodResult();
  record.entries = 41;
  assert.deepEqual(validateResult(record, { now }), []);

  for (const bad of [1, 1000, 4.5, '41']) {
    const invalid = { ...goodResult(), entries: bad };
    const errors = validateResult(invalid, { now });
    assert.equal(errors.length, 1, `expected an error for entries ${bad}`);
    assert.match(errors[0], /\.entries:/);
  }
});

test('a result is rejected when it is not an object', () => {
  assert.match(validateResult('nope')[0], /must be a JSON object/);
  assert.match(validateResult(null)[0], /must be a JSON object/);
  assert.match(validateResult([])[0], /must be a JSON object/);
});

test('a valid driver passes, with and without the optional parts', () => {
  assert.deepEqual(validateDriver(goodDriver()), []);
  const plain = goodDriver();
  delete plain.stats;
  delete plain.socials;
  delete plain.bio;
  delete plain.active;
  assert.deepEqual(validateDriver(plain), []);
});

test('a crew member may have an empty number', () => {
  const record = { ...goodDriver(), id: 'priya', role: 'pitwall', group: 'crew', number: '' };
  assert.deepEqual(validateDriver(record), []);
});

test('a road driver must have a number', () => {
  const record = { ...goodDriver(), number: '' };
  const errors = validateDriver(record);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /\.number:/);
});

test('driver rejects bad country, licence, irating and links', () => {
  const cases = [
    [{ country: 'usa' }, /\.country:/],
    [{ country: 'US' }, /\.country:/],
    [{ number: '1234' }, /\.number:/],
    [{ number: 14 }, /\.number:/],
    [{ role: 'engineer' }, /\.role:/],
    [{ group: 'pitwall' }, /\.group:/],
    [{ stats: { irating: 20000 } }, /\.stats\.irating:/],
    [{ stats: { irating: '5012' } }, /\.stats\.irating:/],
    [{ stats: { licence: 'A4.20' } }, /\.stats\.licence:/],
    [{ stats: { licence: 'Z 4.20' } }, /\.stats\.licence:/],
    [{ socials: { x: 'http://x.com/example' } }, /\.socials\.x:/],
    [{ socials: { twitch: 'twitch.tv/name' } }, /\.socials\.twitch:/],
    [{ active: 'yes' }, /\.active:/],
    [{ bio: 'x'.repeat(141) }, /\.bio:/],
  ];
  for (const [patch, pattern] of cases) {
    const errors = validateDriver({ ...goodDriver(), ...patch });
    assert.equal(errors.length > 0, true, `expected an error for ${JSON.stringify(patch)}`);
    assert.match(errors.join('\n'), pattern);
  }
});

test('a driver bio may be empty', () => {
  assert.deepEqual(validateDriver({ ...goodDriver(), bio: '' }), []);
});

test('a valid event passes, with and without an end date', () => {
  assert.deepEqual(validateEvent(goodEvent()), []);
  const oneDay = goodEvent();
  delete oneDay.end;
  delete oneDay.note;
  assert.deepEqual(validateEvent(oneDay), []);
});

test('event rejects a bad range, status and class list', () => {
  const cases = [
    [{ end: '2026-09-24' }, /\.end:/],
    [{ end: 'soon' }, /\.end:/],
    [{ status: 'entered' }, /\.status:/],
    [{ classes: [] }, /\.classes:/],
    [{ classes: ['GTP', 'GTP'] }, /must not repeat/],
    [{ classes: ['GTP', 'LMP2', 'GT3', 'GT4', 'TCR'] }, /\.classes:/],
    [{ classes: ['Trucks'] }, /\.classes\[0\]:/],
    [{ start: '2026-02-30' }, /\.start:/],
  ];
  for (const [patch, pattern] of cases) {
    const errors = validateEvent({ ...goodEvent(), ...patch });
    assert.equal(errors.length > 0, true, `expected an error for ${JSON.stringify(patch)}`);
    assert.match(errors.join('\n'), pattern);
  }
});

test('an end date equal to the start is allowed', () => {
  assert.deepEqual(validateEvent({ ...goodEvent(), start: '2026-09-25', end: '2026-09-25' }), []);
});

test('validateArray reports duplicate ids once, naming both places', () => {
  const first = goodResult();
  const second = { ...goodResult(), position: 5 };
  const { ok, errors } = validateArray('results', [first, second], { now });
  assert.equal(ok, false);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /results\.json\[1\]\.id: duplicate id ".*", already used at index 0/);
});

test('validateArray accepts records that are not sorted', () => {
  // Sorting is the writer's job, so an unsorted file is still valid.
  const older = { ...goodResult(), id: 'older-result-here', date: '2026-01-24' };
  const newer = goodResult();
  const { ok } = validateArray('results', [older, newer], { now });
  assert.equal(ok, true);
});

test('validateArray rejects anything that is not an array', () => {
  assert.equal(validateArray('results', { id: 'x' }).ok, false);
  assert.match(validateArray('results', null).errors[0], /must contain a JSON array/);
});

test('validateArray accepts an empty file', () => {
  assert.deepEqual(validateArray('events', []), { ok: true, errors: [] });
});

test('unknown fields are ignored, and _placeholder must be a boolean', () => {
  assert.deepEqual(validateResult({ ...goodResult(), somethingNew: 'kept' }, { now }), []);
  assert.deepEqual(validateResult({ ...goodResult(), _placeholder: true }, { now }), []);
  const placeholderErrors = validateResult({ ...goodResult(), _placeholder: 'yes' }, { now });
  assert.equal(placeholderErrors.length, 1);
  assert.match(placeholderErrors[0], /\._placeholder: /);
});

test('validateAll reports counts and gathers every problem', () => {
  const { ok, errors, counts } = validateAll(
    {
      results: [goodResult()],
      drivers: [goodDriver(), { ...goodDriver(), id: 'bad-country', country: 'usa' }],
      events: [goodEvent()],
    },
    { now },
  );
  assert.equal(ok, false);
  assert.deepEqual(counts, { results: 1, drivers: 2, events: 1 });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /^drivers\.json\[1\]\.country: /);
});

test('the shipped sample data is valid', async () => {
  const { readFile } = await import('node:fs/promises');
  const counts = {};
  for (const kind of ['results', 'drivers', 'events']) {
    const text = await readFile(new URL(`../sample-data/${kind}.json`, import.meta.url), 'utf8');
    const records = JSON.parse(text);
    const { ok, errors } = validateArray(kind, records, { now });
    assert.equal(ok, true, `sample-data/${kind}.json: ${errors.join('; ')}`);
    counts[kind] = records.length;
  }
  assert.deepEqual(counts, { results: 6, drivers: 8, events: 3 });
});
