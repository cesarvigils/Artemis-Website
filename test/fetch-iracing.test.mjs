/**
 * Tests for scripts/fetch-iracing.mjs. Run with `npm run test:sync`.
 *
 * No network and no credentials: the API calls are either served from
 * scripts/fixtures/iracing or from a fake fetch defined here.
 *
 * The contract validator at the bottom of this file is written from
 * docs/data-contract.md on purpose - it is deliberately a second opinion, not a
 * call into the script's own validateDocument().
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildDriverEntry,
  carCatalogue,
  createNetworkSource,
  fixtureFileForPath,
  formatSafety,
  hashPassword,
  licenceLetter,
  mapLicenses,
  mapRecentRaces,
  RECENT_LIMIT,
  run,
  selectDrivers,
  serialise,
  SyncError,
  validateDocument,
} from '../scripts/fetch-iracing.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, '..', 'scripts', 'fixtures', 'iracing');

const scratch = [];
process.on('exit', () => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'artemis-stats-'));
  scratch.push(dir);
  return dir;
}

/* Credentials -------------------------------------------------------- */

test('the password hash matches iRacing\'s documented legacy scheme', () => {
  // base64(sha256("correct horse battery staple" + "driver@example.com")),
  // verified with: node -e "..." using crypto directly.
  const expected = 'M6rjLwpQtFHlL31RFV2mefB+0V/T5FjhrxnUL1EU798=';
  assert.equal(hashPassword('correct horse battery staple', 'driver@example.com'), expected);
  // The email is lowercased before hashing, so the casing the maintainer typed
  // into the secret cannot change the hash.
  assert.equal(hashPassword('correct horse battery staple', 'Driver@Example.COM'), expected);
  assert.notEqual(hashPassword('wrong password', 'driver@example.com'), expected);
  // It is a base64 sha-256 digest: 44 characters ending in "=".
  assert.match(hashPassword('x', 'y@z.com'), /^[A-Za-z0-9+/]{43}=$/);
});

/* Licences ----------------------------------------------------------- */

test('licence class comes from the group name, then from the level', () => {
  assert.equal(licenceLetter({ group_name: 'Class A', license_level: 18 }), 'A');
  assert.equal(licenceLetter({ group_name: 'Class D', license_level: 7 }), 'D');
  assert.equal(licenceLetter({ group_name: 'Rookie', license_level: 3 }), 'R');
  assert.equal(licenceLetter({ group_name: 'Pro/WC', license_level: 21 }), 'P');
  assert.equal(licenceLetter({ license_level: 14 }), 'B');
  assert.equal(licenceLetter({ license_level: 11 }), 'C');
  assert.equal(licenceLetter({}), null);
});

test('safety ratings format as the contract licence string', () => {
  assert.equal(formatSafety({ group_name: 'Class A', safety_rating: 4.2 }), 'A 4.20');
  assert.equal(formatSafety({ group_name: 'Class B', safety_rating: 3.1 }), 'B 3.10');
  assert.equal(formatSafety({ group_name: 'Rookie', safety_rating: 2.5 }), 'R 2.50');
  assert.equal(formatSafety({ group_name: 'Class C', safety_rating: 3.021 }), 'C 3.02');
  assert.match(formatSafety({ group_name: 'Class A', safety_rating: 4.2 }), /^[A-DRP] \d\.\d{2}$/);
  assert.equal(formatSafety({ group_name: 'Class A' }), null);
  assert.equal(formatSafety({ safety_rating: 4.2 }), null);
});

test('licence categories map to the five contract keys', () => {
  const { irating, safety } = mapLicenses([
    { category_id: 1, license_level: 14, safety_rating: 3.1, irating: 3400, group_name: 'Class B' },
    { category_id: 3, license_level: 7, safety_rating: 2.84, irating: 1350, group_name: 'Class D' },
    { category_id: 4, license_level: 5, safety_rating: 2.06, irating: 1290, group_name: 'Class D' },
    { category_id: 5, license_level: 18, safety_rating: 4.2, irating: 5012, group_name: 'Class A' },
    { category_id: 6, license_level: 11, safety_rating: 3.47, irating: 2100, group_name: 'Class C' },
  ]);
  assert.deepEqual(irating, {
    oval: 3400,
    dirt_oval: 1350,
    dirt_road: 1290,
    sports_car: 5012,
    formula_car: 2100,
  });
  assert.deepEqual(safety, {
    oval: 'B 3.10',
    dirt_oval: 'D 2.84',
    dirt_road: 'D 2.06',
    sports_car: 'A 4.20',
    formula_car: 'C 3.47',
  });
});

test('missing categories are left out rather than zeroed', () => {
  const { irating, safety } = mapLicenses([
    { category_id: 1, license_level: 17, safety_rating: 3.88, irating: 4180, group_name: 'Class A' },
    { category_id: 5, license_level: 9, safety_rating: 3.02, irating: 1855, group_name: 'Class C' },
  ]);
  assert.deepEqual(Object.keys(irating).sort(), ['oval', 'sports_car']);
  assert.equal('formula_car' in irating, false);
  assert.equal('dirt_road' in safety, false);
});

test('the legacy road category fills sports_car, but a real one wins', () => {
  const legacyOnly = mapLicenses([
    { category_id: 2, license_level: 16, safety_rating: 3.5, irating: 2400, group_name: 'Class B' },
  ]);
  assert.deepEqual(legacyOnly.irating, { sports_car: 2400 });
  assert.deepEqual(legacyOnly.safety, { sports_car: 'B 3.50' });

  const legacyFirst = mapLicenses([
    { category_id: 2, license_level: 16, safety_rating: 3.5, irating: 2400, group_name: 'Class B' },
    { category_id: 5, license_level: 18, safety_rating: 4.2, irating: 5012, group_name: 'Class A' },
  ]);
  const legacyLast = mapLicenses([
    { category_id: 5, license_level: 18, safety_rating: 4.2, irating: 5012, group_name: 'Class A' },
    { category_id: 2, license_level: 16, safety_rating: 3.5, irating: 2400, group_name: 'Class B' },
  ]);
  assert.deepEqual(legacyFirst.irating, { sports_car: 5012 });
  assert.deepEqual(legacyFirst.safety, { sports_car: 'A 4.20' });
  assert.deepEqual(legacyLast.irating, { sports_car: 5012 });
  assert.deepEqual(legacyLast.safety, { sports_car: 'A 4.20' });
});

test('an unraced category (irating -1) keeps its licence but no iRating', () => {
  const { irating, safety } = mapLicenses([
    { category_id: 4, license_level: 2, safety_rating: 2.5, irating: -1, group_name: 'Rookie' },
  ]);
  assert.deepEqual(irating, {});
  assert.deepEqual(safety, { dirt_road: 'R 2.50' });
});

/* Recent races -------------------------------------------------------- */

function race(overrides = {}) {
  return {
    series_name: 'GT Sprint Series',
    car_id: 173,
    session_start_time: '2026-09-12T18:00:00Z',
    start_position: 8,
    finish_position: 3,
    incidents: 2,
    strength_of_field: 3120,
    track: { track_id: 18, track_name: 'Suzuka International Racing Course' },
    ...overrides,
  };
}

test('a race maps to the contract row, with 1-based positions', () => {
  const [row] = mapRecentRaces({ races: [race({ series_name: 'IMSA Endurance' })] }, () => 'BMW M4 GT3');
  assert.deepEqual(row, {
    date: '2026-09-12',
    series: 'IMSA Endurance',
    track: 'Suzuka International Racing Course',
    car: 'BMW M4 GT3',
    start: 9, // the API is 0-based: P9 on the grid
    finish: 4,
    sof: 3120,
    incidents: 2,
  });
});

test('car names come from the catalogue, with the id as a last resort', () => {
  const lookup = carCatalogue([{ car_id: 173, car_name: 'BMW M4 GT3' }]);
  assert.equal(lookup(173), 'BMW M4 GT3');
  assert.equal(lookup(999), null);
  const [known] = mapRecentRaces({ races: [race()] }, lookup);
  const [unknown] = mapRecentRaces({ races: [race({ car_id: 999 })] }, lookup);
  assert.equal(known.car, 'BMW M4 GT3');
  assert.equal(unknown.car, 'Car 999');
});

test('optional fields are omitted when the API has nothing useful', () => {
  const [row] = mapRecentRaces(
    { races: [race({ strength_of_field: 0, incidents: undefined, car_name: 'Ferrari 296 GT3' })] },
    () => null
  );
  assert.equal('sof' in row, false);
  assert.equal('incidents' in row, false);
  assert.equal(row.car, 'Ferrari 296 GT3');
});

test('recent races are capped at ten, newest first, official only', () => {
  const races = [];
  for (let day = 1; day <= 14; day += 1) {
    races.push(
      race({ session_start_time: `2026-09-${String(day).padStart(2, '0')}T18:00:00Z`, finish_position: day })
    );
  }
  races.push(race({ session_start_time: '2026-09-13T18:00:00Z', official_session: false }));

  const rows = mapRecentRaces({ races }, () => 'BMW M4 GT3');
  assert.equal(rows.length, RECENT_LIMIT);
  assert.equal(rows.length <= 10, true);
  assert.equal(rows[0].date, '2026-09-14');
  assert.equal(rows.at(-1).date, '2026-09-05');
  for (let i = 1; i < rows.length; i += 1) {
    assert.ok(rows[i - 1].date >= rows[i].date, 'rows must be newest first');
  }
  // The league (non-official) race on the 13th is not in the list twice.
  assert.equal(rows.filter((row) => row.date === '2026-09-13').length, 1);
});

test('rows without a usable date or finish are dropped', () => {
  const rows = mapRecentRaces({
    races: [race({ session_start_time: null }), race({ finish_position: -1 }), race()],
  });
  assert.equal(rows.length, 1);
});

/* Roster ------------------------------------------------------------- */

test('only drivers with a usable iracingId are synced', () => {
  const warnings = [];
  const selected = selectDrivers(
    [
      { id: 'zoe-adams', iracingId: 222222 },
      { id: 'alan-bell', iracingId: 111111 },
      { id: 'no-id-here' },
      { id: 'bad-number', iracingId: 'abc' },
      { id: 'Bad Slug', iracingId: 333333 },
      { id: 'out-of-range', iracingId: 0 },
    ],
    (message) => warnings.push(message)
  );
  assert.deepEqual(
    selected.map((driver) => driver.id),
    ['alan-bell', 'zoe-adams']
  );
  assert.equal(warnings.length, 3);
});

/* Serialisation ------------------------------------------------------- */

test('serialisation is deterministic: sorted keys, 2 spaces, LF, final newline', () => {
  const a = { source: 'x', updated: 'u', drivers: { b: { irating: { oval: 1 }, iracingId: 2 } } };
  const b = { drivers: { b: { iracingId: 2, irating: { oval: 1 } } }, updated: 'u', source: 'x' };
  const json = serialise(a);

  assert.equal(json, serialise(b), 'key order in memory must not change the bytes');
  assert.equal(json.endsWith('\n'), true);
  assert.equal(json.includes('\r'), false);
  assert.equal(json.split('\n')[1], '  "drivers": {');
  const keys = [...json.matchAll(/^ {2}"([a-z]+)"/gm)].map((match) => match[1]);
  assert.deepEqual(keys, ['drivers', 'source', 'updated']);
});

/* Validation ---------------------------------------------------------- */

test('the script rejects a document that breaks the contract', () => {
  assert.deepEqual(
    validateDocument({ updated: '2026-09-14T09:00:12Z', source: 'iracing-data-api', drivers: {} }),
    []
  );
  const problems = validateDocument({
    updated: 'yesterday',
    source: 'guesswork',
    drivers: { 'a-driver': { iracingId: 1, safety: { oval: 'A4.20' }, recent: [{ date: 'x' }] } },
  });
  assert.ok(problems.length >= 4, problems.join('\n'));
});

/* The API plumbing (fake fetch) ---------------------------------------- */

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    json: async () => body,
  };
}

function cookieResponse(body, cookies) {
  const headers = new Headers();
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return { status: 200, ok: true, headers, json: async () => body };
}

test('auth sends the hashed password and keeps the session cookies', async () => {
  const calls = [];
  const source = createNetworkSource({
    email: 'Driver@Example.com',
    password: 'correct horse battery staple',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      if (String(url).endsWith('/auth')) {
        return cookieResponse(JSON.parse(readFileSync(join(FIXTURES, 'auth.json'), 'utf8')), [
          'irsso_membersv2=abc123; Path=/; HttpOnly',
          'authtoken_members=%7B%22authtoken%22%3A%7B%7D%7D; Path=/',
        ]);
      }
      if (String(url).includes('/data/')) return jsonResponse({ link: 'https://s3.example/payload' });
      return jsonResponse({ members: [{ cust_id: 123456 }] });
    },
  });

  const started = Date.now();
  await source.authenticate();
  const body = JSON.parse(calls[0].init.body);
  assert.equal(calls[0].url, 'https://members-ng.iracing.com/auth');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(body.email, 'Driver@Example.com');
  assert.equal(body.password, 'M6rjLwpQtFHlL31RFV2mefB+0V/T5FjhrxnUL1EU798=');
  assert.equal(body.password.includes('correct horse'), false, 'the plain password must never be sent');

  const payload = await source.get('/data/member/get?cust_ids=123456&include_licenses=true');
  assert.deepEqual(payload, { members: [{ cust_id: 123456 }] });
  // Two hops: the member endpoint, then the pre-signed link it points at.
  assert.equal(calls.length, 3);
  assert.match(calls[1].init.headers.cookie, /irsso_membersv2=abc123/);
  assert.match(calls[1].init.headers.cookie, /authtoken_members=/);
  assert.equal(calls[2].url, 'https://s3.example/payload');
  assert.equal(calls[2].init.headers?.cookie, undefined, 'the S3 link is pre-signed: send no cookies');
  // A response without rate-limit headers means "budget unknown", not "budget
  // spent": reading an absent header as 0 used to make every call sleep.
  assert.ok(Date.now() - started < 1000, 'calls must not pause when no rate-limit header is sent');
});

test('an exhausted rate-limit budget makes the next call wait', async () => {
  let calls = 0;
  const source = createNetworkSource({
    email: 'driver@example.com',
    password: 'secret',
    fetchImpl: async (url) => {
      calls += 1;
      if (String(url).endsWith('/auth')) {
        return cookieResponse({ authcode: 'ok' }, ['irsso_membersv2=abc123; Path=/']);
      }
      return jsonResponse(
        { members: [] },
        {
          headers: {
            'x-ratelimit-remaining': '0',
            // Epoch seconds, a quarter of a second from now.
            'x-ratelimit-reset': String((Date.now() + 250) / 1000),
          },
        }
      );
    },
  });
  await source.authenticate();
  const started = Date.now();
  await source.get('/data/member/get?cust_ids=1&include_licenses=true');
  assert.ok(Date.now() - started >= 200, 'the script must back off when the budget is spent');
  assert.equal(calls, 2);
});

test('a 2FA account fails with exit code 2 and an actionable message', async () => {
  const source = createNetworkSource({
    email: 'driver@example.com',
    password: 'secret',
    fetchImpl: async () =>
      jsonResponse(JSON.parse(readFileSync(join(FIXTURES, 'auth-verification-required.json'), 'utf8'))),
  });
  await assert.rejects(
    () => source.authenticate(),
    (error) => {
      assert.ok(error instanceof SyncError);
      assert.equal(error.code, 2);
      assert.match(error.message, /two-factor/i);
      return true;
    }
  );
});

test('missing credentials fail as an auth error, not a crash', async () => {
  const source = createNetworkSource({ email: '', password: '', fetchImpl: async () => jsonResponse({}) });
  await assert.rejects(() => source.authenticate(), { code: 2 });
});

test('fixture paths map to the sample response files', () => {
  assert.equal(
    fixtureFileForPath('/data/member/get?cust_ids=123456&include_licenses=true'),
    'member-123456.json'
  );
  assert.equal(
    fixtureFileForPath('/data/stats/member_recent_races?cust_id=654321'),
    'recent-races-654321.json'
  );
  assert.equal(fixtureFileForPath('/data/car/get'), 'cars.json');
  assert.equal(fixtureFileForPath('/data/whatever'), null);
});

/* Entry building ------------------------------------------------------ */

test('a member payload plus races becomes one stats entry', () => {
  const member = JSON.parse(readFileSync(join(FIXTURES, 'member-123456.json'), 'utf8'));
  const recent = JSON.parse(readFileSync(join(FIXTURES, 'recent-races-123456.json'), 'utf8'));
  const cars = carCatalogue(JSON.parse(readFileSync(join(FIXTURES, 'cars.json'), 'utf8')));
  const entry = buildDriverEntry({ id: 'mateo-ferreira', iracingId: 123456 }, member, recent, cars);

  assert.equal(entry.iracingId, 123456);
  assert.equal(entry.irating.sports_car, 5012);
  assert.equal(entry.safety.sports_car, 'A 4.20');
  assert.equal(entry.recent.length, RECENT_LIMIT);
  assert.equal(entry.recent[0].car, 'BMW M4 GT3');
});

/* End to end ---------------------------------------------------------- */

test('the fixture run writes a contract-valid stats.json', async () => {
  const out = join(tempDir(), 'stats.json');
  const result = await run({ fixture: FIXTURES, out, now: new Date('2026-09-14T09:00:12.345Z') });

  assert.equal(result.code, 0);
  assert.equal(result.wrote, true);

  const written = readFileSync(out, 'utf8');
  assert.equal(written, result.json);
  assert.equal(written.endsWith('\n'), true);
  assert.equal(written.includes('\r'), false);

  const document = JSON.parse(written);
  assert.deepEqual(validateStats(document), [], 'contract problems');
  assert.equal(document.updated, '2026-09-14T09:00:12Z');
  assert.equal(document.source, 'iracing-data-api');
  assert.deepEqual(Object.keys(document.drivers).sort(), ['colt-vandermeer', 'mateo-ferreira']);

  const mateo = document.drivers['mateo-ferreira'];
  assert.equal(mateo.iracingId, 123456);
  assert.deepEqual(Object.keys(mateo.irating).sort(), [
    'dirt_oval',
    'dirt_road',
    'formula_car',
    'oval',
    'sports_car',
  ]);
  assert.equal(mateo.recent.length, 10);
  assert.deepEqual(mateo.recent[0], {
    car: 'BMW M4 GT3',
    date: '2026-09-12',
    finish: 4,
    incidents: 2,
    series: 'IMSA Endurance Series',
    sof: 3120,
    start: 9,
    track: 'Suzuka International Racing Course',
  });

  // The second driver is the one with two categories missing.
  const colt = document.drivers['colt-vandermeer'];
  assert.deepEqual(Object.keys(colt.irating).sort(), ['dirt_oval', 'oval', 'sports_car']);
  assert.equal('formula_car' in colt.irating, false);
  assert.equal('dirt_road' in colt.irating, false);
  assert.equal(colt.safety.dirt_oval, 'R 2.50');
  assert.equal(colt.recent.length, 3);
});

test('a dry run prints nothing to disk', async () => {
  const out = join(tempDir(), 'stats.json');
  const result = await run({ fixture: FIXTURES, out, dryRun: true, now: new Date('2026-09-14T09:00:12Z') });
  assert.equal(result.code, 0);
  assert.equal(result.wrote, false);
  assert.deepEqual(validateStats(JSON.parse(result.json)), []);
  assert.throws(() => readFileSync(out, 'utf8'), { code: 'ENOENT' });
});

test('unchanged content does not rewrite the file', async () => {
  const out = join(tempDir(), 'stats.json');
  const first = await run({ fixture: FIXTURES, out, now: new Date('2026-09-14T09:00:12Z') });
  const afterFirst = readFileSync(out, 'utf8');

  // A night later, with the same facts: the timestamp alone must not count.
  const second = await run({ fixture: FIXTURES, out, now: new Date('2026-09-15T09:00:44Z') });
  assert.equal(first.wrote, true);
  assert.equal(second.wrote, false);
  assert.equal(readFileSync(out, 'utf8'), afterFirst);
  assert.equal(JSON.parse(readFileSync(out, 'utf8')).updated, '2026-09-14T09:00:12Z');

  // A real change is written, timestamp and all.
  writeFileSync(
    out,
    serialise({
      updated: '2026-09-13T09:00:00Z',
      source: 'iracing-data-api',
      drivers: { 'mateo-ferreira': { iracingId: 123456 } },
    }),
    'utf8'
  );
  const third = await run({ fixture: FIXTURES, out, now: new Date('2026-09-16T09:00:00Z') });
  assert.equal(third.wrote, true);
  assert.equal(JSON.parse(readFileSync(out, 'utf8')).updated, '2026-09-16T09:00:00Z');
});

test('a malformed existing file is replaced rather than trusted', async () => {
  const out = join(tempDir(), 'stats.json');
  writeFileSync(out, '{ not json', 'utf8');
  const result = await run({ fixture: FIXTURES, out, now: new Date('2026-09-14T09:00:12Z') });
  assert.equal(result.wrote, true);
  assert.deepEqual(validateStats(JSON.parse(readFileSync(out, 'utf8'))), []);
});

test('no driver with an iracingId still writes a valid empty document', async () => {
  const dir = tempDir();
  const out = join(dir, 'stats.json');
  const drivers = join(dir, 'drivers.json');
  // The real src/data/drivers.json today: nobody has an iracingId yet.
  writeFileSync(
    drivers,
    JSON.stringify([
      { id: 'mateo-ferreira', name: 'Mateo Ferreira', role: 'driver', group: 'road' },
      { id: 'tomas-ek', name: 'Tomas Ek', role: 'staff', group: 'crew' },
    ]),
    'utf8'
  );

  const result = await run({ drivers, out, now: new Date('2026-09-14T09:00:12Z') });
  assert.equal(result.code, 0);
  assert.equal(result.wrote, true);

  const document = JSON.parse(readFileSync(out, 'utf8'));
  assert.deepEqual(document, {
    updated: '2026-09-14T09:00:12Z',
    source: 'iracing-data-api',
    drivers: {},
  });
  assert.deepEqual(validateStats(document), []);
});

test('the repository roster parses and every iracingId in it is usable', () => {
  const roster = JSON.parse(
    readFileSync(join(here, '..', 'src', 'data', 'drivers.json'), 'utf8')
  );
  const warnings = [];
  const selected = selectDrivers(roster, (message) => warnings.push(message));
  assert.deepEqual(warnings, [], 'a driver has an iracingId the sync would skip');
  assert.equal(
    selected.length,
    roster.filter((driver) => driver.iracingId !== undefined).length,
    'every roster iracingId must survive selection'
  );
});

test('a missing fixture file is an API failure, exit code 3', async () => {
  const dir = tempDir();
  const drivers = join(dir, 'drivers.json');
  writeFileSync(drivers, JSON.stringify([{ id: 'ghost-driver', iracingId: 424242 }]), 'utf8');
  const result = await run({ fixture: FIXTURES, drivers, out: join(dir, 'stats.json') });
  assert.equal(result.code, 3);
  assert.match(result.message, /member-424242\.json/);
});

/* An independent reading of docs/data-contract.md ---------------------- */

const CATEGORIES = ['sports_car', 'formula_car', 'oval', 'dirt_oval', 'dirt_road'];
const LICENCE = /^[A-DRP] \d\.\d{2}$/;
const SLUG = /^[a-z0-9-]{3,80}$/;

/** Returns a list of contract violations; an empty list means the file is good. */
function validateStats(document) {
  const problems = [];
  const check = (condition, message) => {
    if (!condition) problems.push(message);
  };
  const isPlainObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const isInteger = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

  if (!isPlainObject(document)) return ['stats.json must be an object'];
  check(
    typeof document.updated === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(document.updated) &&
      !Number.isNaN(Date.parse(document.updated)),
    'updated must be an ISO UTC timestamp'
  );
  check(document.source === 'iracing-data-api', 'source must be "iracing-data-api"');
  check(isPlainObject(document.drivers), 'drivers must be an object');
  check(
    Object.keys(document).every((key) => ['updated', 'source', 'drivers'].includes(key)),
    'stats.json must hold only updated, source and drivers'
  );
  if (!isPlainObject(document.drivers)) return problems;

  for (const [id, entry] of Object.entries(document.drivers)) {
    check(SLUG.test(id), `${id}: key must be a drivers.json id slug`);
    if (!isPlainObject(entry)) {
      problems.push(`${id}: must be an object`);
      continue;
    }
    check(isInteger(entry.iracingId, 1, 99999999), `${id}.iracingId must be 1-99999999`);
    check(
      Object.keys(entry).every((key) => ['iracingId', 'irating', 'safety', 'recent'].includes(key)),
      `${id}: unknown field`
    );

    if (entry.irating !== undefined) {
      check(isPlainObject(entry.irating), `${id}.irating must be an object`);
      for (const [key, value] of Object.entries(entry.irating ?? {})) {
        check(CATEGORIES.includes(key), `${id}.irating.${key} is not an iRacing category`);
        check(isInteger(value, 0, 15000), `${id}.irating.${key} must be an integer 0-15000`);
      }
    }
    if (entry.safety !== undefined) {
      check(isPlainObject(entry.safety), `${id}.safety must be an object`);
      for (const [key, value] of Object.entries(entry.safety ?? {})) {
        check(CATEGORIES.includes(key), `${id}.safety.${key} is not an iRacing category`);
        check(typeof value === 'string' && LICENCE.test(value), `${id}.safety.${key} must look like "A 4.20"`);
      }
    }
    if (entry.recent === undefined) continue;

    check(Array.isArray(entry.recent), `${id}.recent must be an array`);
    if (!Array.isArray(entry.recent)) continue;
    check(entry.recent.length <= 10, `${id}.recent must hold at most 10 races`);
    let previous = null;
    entry.recent.forEach((row, i) => {
      const at = `${id}.recent[${i}]`;
      if (!isPlainObject(row)) {
        problems.push(`${at} must be an object`);
        return;
      }
      check(
        typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date),
        `${at}.date must be an ISO date`
      );
      check(!Number.isNaN(Date.parse(row.date)), `${at}.date must be a real date`);
      for (const field of ['series', 'track', 'car']) {
        check(
          typeof row[field] === 'string' && row[field].trim() === row[field] && row[field].length > 0,
          `${at}.${field} must be a trimmed non-empty string`
        );
      }
      for (const field of ['start', 'finish']) {
        check(isInteger(row[field], 1, 999), `${at}.${field} must be an integer 1-999`);
      }
      if (row.sof !== undefined) check(isInteger(row.sof, 0, 20000), `${at}.sof must be an integer`);
      if (row.incidents !== undefined) {
        check(isInteger(row.incidents, 0, 999), `${at}.incidents must be an integer`);
      }
      check(
        Object.keys(row).every((key) =>
          ['date', 'series', 'track', 'car', 'start', 'finish', 'sof', 'incidents'].includes(key)
        ),
        `${at}: unknown field`
      );
      check(previous === null || previous >= row.date, `${at}: races must be newest first`);
      previous = row.date;
    });
  }
  return problems;
}
