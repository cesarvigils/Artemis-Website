#!/usr/bin/env node
/**
 * Nightly iRacing statistics sync: writes src/data/stats.json.
 *
 * WHAT IT DOES
 *   1. Reads src/data/drivers.json and keeps every driver that has an
 *      `iracingId` (the iRacing customer id). If no driver has one, it writes a
 *      valid empty document ({ updated, source, drivers: {} }) and exits 0, so
 *      the file always parses and the site always has something to import.
 *   2. Logs in to the iRacing member site with IRACING_EMAIL / IRACING_PASSWORD
 *      and keeps the session cookies for the data calls.
 *   3. Per driver: member licences + iRating (/data/member/get) and the ten
 *      newest official races (/data/stats/member_recent_races). Car names come
 *      from one /data/car/get lookup shared by every driver.
 *   4. Serialises deterministically (sorted keys, 2-space, LF, trailing newline)
 *      and rewrites src/data/stats.json ONLY when something other than the
 *      `updated` timestamp changed, so the nightly workflow does not commit a
 *      new timestamp every single night.
 *
 * SETUP (see docs/iracing-sync.md for the long version)
 *   IRACING_EMAIL / IRACING_PASSWORD -> a dedicated iRacing member account with
 *   an active subscription and 2FA (legacy authentication) DISABLED. The data
 *   API has no token or API-key flow; it is the member login or nothing.
 *   In CI they are repository secrets; nothing is ever logged (this script never
 *   prints the password, the hash, or any cookie).
 *
 * AUTHENTICATION
 *   POST https://members-ng.iracing.com/auth with
 *     { email, password: base64(sha256(plainPassword + email.toLowerCase())) }
 *   That hash is iRacing's documented legacy scheme: the plaintext password
 *   never leaves this process. An account with 2FA enabled answers with
 *   `verificationRequired` and cannot be used unattended - the script fails with
 *   exit code 2 and says so.
 *
 * THE TWO-STEP /data READ
 *   Every /data/... endpoint answers with a tiny JSON envelope
 *   `{ "link": "https://...s3.amazonaws.com/..." }` (sometimes with
 *   `expires`); the real payload is behind a second GET to that pre-signed S3
 *   URL, which must be fetched WITHOUT the member cookies. `followLink()` does
 *   that once for every call.
 *
 * FLAGS
 *   --dry-run            print the document, write nothing
 *   --fixture <dir>      read every API response from JSON files in <dir>
 *                        instead of the network (no credentials needed). If the
 *                        directory holds a drivers.json it is also used as the
 *                        roster, unless --drivers says otherwise.
 *   --drivers <path>     read the roster from <path> instead of src/data/drivers.json
 *
 * EXIT CODES
 *   0 wrote (or had nothing to do, or the content was unchanged)
 *   2 authentication failed (bad credentials, 2FA, no cookies)
 *   3 an API call failed (network, HTTP error, rate limit that would not clear)
 *   4 the document that was built does not satisfy the data contract; nothing
 *     was written
 *
 * The site treats stats.json as optional, so a failing sync leaves the deployed
 * site exactly as it was - the previous file stays committed and check:data
 * never fails the build because of this file.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const AUTH_URL = 'https://members-ng.iracing.com/auth';
export const API_BASE = 'https://members-ng.iracing.com';
export const SOURCE = 'iracing-data-api';
export const DEFAULT_DRIVERS = join(root, 'src', 'data', 'drivers.json');
export const DEFAULT_OUT = join(root, 'src', 'data', 'stats.json');

/** At most this many races per driver, newest first (data contract). */
export const RECENT_LIMIT = 10;

/**
 * iRacing licence category ids -> the contract's iRating keys.
 * 2 is the legacy combined "road" category, which iRacing split into 5 (sports
 * car) and 6 (formula car); accounts that have not raced since the split still
 * report it. It maps to sports_car, but a real id 5 always wins over it.
 */
export const CATEGORY_BY_ID = {
  1: 'oval',
  2: 'sports_car',
  3: 'dirt_oval',
  4: 'dirt_road',
  5: 'sports_car',
  6: 'formula_car',
};

const LEGACY_ROAD_ID = 2;

/** Delay between drivers on the network path, to stay well inside the limits. */
const DRIVER_DELAY_MS = 600;

/** An error that carries the process exit code the contract asks for. */
export class SyncError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SyncError';
    this.code = code;
  }
}

/* Credentials -------------------------------------------------------- */

/**
 * iRacing's legacy password hash: base64(sha256(password + lowercased email)).
 * The email is lowercased because iRacing treats logins case-insensitively but
 * hashes the exact bytes, so "Driver@x.com" and "driver@x.com" must agree.
 */
export function hashPassword(plainPassword, email) {
  return createHash('sha256')
    .update(`${plainPassword}${String(email).toLowerCase()}`)
    .digest('base64');
}

/* Serialisation ------------------------------------------------------ */

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
    return out;
  }
  return value;
}

/**
 * Deterministic JSON: keys sorted at every depth, 2-space indent, LF endings,
 * trailing newline. Two runs over the same facts produce byte-identical output,
 * which is what makes "only commit when something changed" possible.
 */
export function serialise(document) {
  return `${JSON.stringify(sortKeys(document), null, 2).replace(/\r\n/g, '\n')}\n`;
}

/** ISO-8601 UTC to the second, like the contract's example. */
export function timestamp(now = new Date()) {
  return `${now.toISOString().slice(0, 19)}Z`;
}

/* Roster ------------------------------------------------------------- */

function readJson(path, what) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (error) {
    throw new SyncError(`cannot read ${what} at ${path} (${error.code ?? error.message})`, 3);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new SyncError(`${what} at ${path} is not valid JSON (${error.message})`, 3);
  }
}

/**
 * The drivers the sync cares about: those with a usable `iracingId`. Anything
 * else in the roster is ignored, and a malformed id is skipped with a warning
 * rather than failing the run - one bad hand edit should not stop the sync.
 */
export function selectDrivers(roster, warn = () => {}) {
  if (!Array.isArray(roster)) throw new SyncError('drivers.json must be a JSON array', 3);
  const selected = [];
  for (const driver of roster) {
    if (!driver || typeof driver !== 'object') continue;
    if (driver.iracingId === undefined || driver.iracingId === null) continue;
    const id = driver.iracingId;
    if (!Number.isInteger(id) || id < 1 || id > 99999999) {
      warn(`skipping ${driver.id ?? '(no id)'}: iracingId must be an integer 1-99999999`);
      continue;
    }
    if (typeof driver.id !== 'string' || !/^[a-z0-9-]{3,80}$/.test(driver.id)) {
      warn(`skipping a driver with iracingId ${id}: its "id" is not a valid slug`);
      continue;
    }
    selected.push({ id: driver.id, iracingId: id, name: driver.name ?? driver.id });
  }
  selected.sort((a, b) => a.id.localeCompare(b.id));
  return selected;
}

/* Mapping: licences and iRating -------------------------------------- */

/**
 * "Class A" / license_level 18 -> "A". iRacing reports the class both as a
 * group name and as a 1-20ish level; the name is authoritative when present
 * because promotions change the level bands, not the names.
 */
export function licenceLetter(license = {}) {
  const name = String(license.group_name ?? '').trim().toLowerCase();
  if (name.startsWith('rookie')) return 'R';
  if (name.startsWith('pro')) return 'P'; // "Pro" and "Pro/WC"
  const fromName = /^class\s+([a-d])\b/.exec(name);
  if (fromName) return fromName[1].toUpperCase();

  const level = Number(license.license_level);
  if (!Number.isFinite(level) || level < 1) return null;
  if (level <= 4) return 'R';
  if (level <= 8) return 'D';
  if (level <= 12) return 'C';
  if (level <= 16) return 'B';
  if (level <= 20) return 'A';
  return 'P';
}

/** The contract's licence string: letter + safety rating, e.g. "A 4.20". */
export function formatSafety(license = {}) {
  const letter = licenceLetter(license);
  const sr = Number(license.safety_rating);
  if (!letter || !Number.isFinite(sr) || sr < 0) return null;
  return `${letter} ${Math.min(sr, 9.99).toFixed(2)}`;
}

/**
 * A member's licence array -> the contract's `irating` and `safety` maps.
 * Categories iRacing does not report, and iRatings it reports as -1 (a category
 * the driver has never raced), are left out entirely.
 */
export function mapLicenses(licenses = []) {
  const irating = {};
  const safety = {};
  const fromLegacy = new Set();

  for (const license of Array.isArray(licenses) ? licenses : []) {
    const categoryId = Number(license?.category_id);
    const key = CATEGORY_BY_ID[categoryId];
    if (!key) continue;
    const legacy = categoryId === LEGACY_ROAD_ID;
    // A real sports-car licence always beats the legacy road one.
    if (legacy && (irating[key] !== undefined || safety[key] !== undefined)) continue;
    if (!legacy && fromLegacy.has(key)) {
      delete irating[key];
      delete safety[key];
      fromLegacy.delete(key);
    }

    const ir = Number(license.irating);
    if (Number.isFinite(ir) && ir > 0) {
      irating[key] = Math.round(ir);
      if (legacy) fromLegacy.add(key);
    }
    const formatted = formatSafety(license);
    if (formatted) {
      safety[key] = formatted;
      if (legacy) fromLegacy.add(key);
    }
  }

  return { irating, safety };
}

/* Mapping: recent races ---------------------------------------------- */

function positionOf(value) {
  const n = Number(value);
  // iRacing reports finishing positions 0-based (0 is the winner).
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n) + 1;
}

/**
 * member_recent_races -> the contract's `recent` rows: official races only,
 * newest first, at most RECENT_LIMIT of them.
 *
 * `carName` resolves car_id through the /data/car/get catalogue; when that
 * lookup was unavailable the row falls back to the id so the sync still runs.
 */
export function mapRecentRaces(payload, carName = () => null, limit = RECENT_LIMIT) {
  const races = Array.isArray(payload?.races)
    ? payload.races
    : Array.isArray(payload)
      ? payload
      : [];

  return races
    .filter((race) => race && race.official_session !== false)
    .map((race) => {
      const start = positionOf(race.start_position);
      const finish = positionOf(race.finish_position);
      const date = String(race.session_start_time ?? '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !finish) return null;

      const row = {
        date,
        series: String(race.series_name ?? 'iRacing').trim().slice(0, 60) || 'iRacing',
        track: String(race.track?.track_name ?? race.track_name ?? 'Unknown').trim().slice(0, 80),
        car:
          String(
            race.car_name ?? carName(race.car_id) ?? (race.car_id ? `Car ${race.car_id}` : 'Unknown')
          )
            .trim()
            .slice(0, 60) || 'Unknown',
        start: start ?? finish,
        finish,
      };

      const sof = Number(race.strength_of_field ?? race.sof);
      if (Number.isFinite(sof) && sof > 0) row.sof = Math.round(sof);
      const incidents = Number(race.incidents);
      if (Number.isFinite(incidents) && incidents >= 0) row.incidents = Math.round(incidents);
      return row;
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/** car_id -> car_name from /data/car/get, for the `car` field. */
export function carCatalogue(payload) {
  const cars = Array.isArray(payload) ? payload : Array.isArray(payload?.cars) ? payload.cars : [];
  const byId = new Map();
  for (const car of cars) {
    if (car && car.car_id !== undefined && car.car_name) byId.set(Number(car.car_id), String(car.car_name));
  }
  return (id) => byId.get(Number(id)) ?? null;
}

/**
 * One member payload + one recent-races payload -> one stats.json entry.
 *
 * The member is matched on `cust_id` and nothing else. If the response does not
 * contain the member that was asked for, the entry keeps the id and stays
 * otherwise empty: everything this file produces is published on the team page
 * under a named driver, so a licence or a race history that cannot be shown to
 * belong to them is not written at all. The site renders nothing for a driver
 * whose entry carries no numbers, which is the right outcome here.
 */
export function buildDriverEntry(driver, memberPayload, recentPayload, carName, warn = () => {}) {
  // iRacing wraps the member in `members`; tolerate a bare member object too.
  const candidates = Array.isArray(memberPayload?.members)
    ? memberPayload.members
    : memberPayload && typeof memberPayload === 'object'
      ? [memberPayload]
      : [];
  const member = candidates.find((m) => Number(m?.cust_id) === driver.iracingId);

  const entry = { iracingId: driver.iracingId };

  if (!member) {
    warn(
      `${driver.id}: iRacing returned no member with cust_id ${driver.iracingId}; ` +
        'leaving the entry empty rather than filling it from another member'
    );
    return entry;
  }

  const { irating, safety } = mapLicenses(member.licenses ?? member.licences ?? []);
  if (Object.keys(irating).length) entry.irating = irating;
  if (Object.keys(safety).length) entry.safety = safety;
  const recent = mapRecentRaces(recentPayload, carName);
  if (recent.length) entry.recent = recent;
  return entry;
}

/* Validation (exit code 4) -------------------------------------------- */

const LICENCE_PATTERN = /^[A-DRP] \d\.\d{2}$/;
const CATEGORY_KEYS = new Set(Object.values(CATEGORY_BY_ID));

/** The contract rules for stats.json, checked before anything is written. */
export function validateDocument(document) {
  const problems = [];
  const fail = (message) => problems.push(message);

  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return ['stats.json must be a JSON object'];
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(String(document.updated))) {
    fail(`updated: must be an ISO UTC timestamp, got ${JSON.stringify(document.updated)}`);
  }
  if (document.source !== SOURCE) {
    fail(`source: must be "${SOURCE}", got ${JSON.stringify(document.source)}`);
  }
  const drivers = document.drivers;
  if (!drivers || typeof drivers !== 'object' || Array.isArray(drivers)) {
    fail('drivers: must be an object keyed by drivers.json id');
    return problems;
  }

  for (const [id, entry] of Object.entries(drivers)) {
    const at = `drivers.${id}`;
    if (!/^[a-z0-9-]{3,80}$/.test(id)) fail(`${at}: key must be a drivers.json id slug`);
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`${at}: must be an object`);
      continue;
    }
    if (!Number.isInteger(entry.iracingId) || entry.iracingId < 1 || entry.iracingId > 99999999) {
      fail(`${at}.iracingId: must be an integer 1-99999999`);
    }
    for (const [key, value] of Object.entries(entry.irating ?? {})) {
      if (!CATEGORY_KEYS.has(key)) fail(`${at}.irating.${key}: not an iRacing category`);
      if (!Number.isInteger(value) || value < 0 || value > 15000) {
        fail(`${at}.irating.${key}: must be an integer 0-15000, got ${JSON.stringify(value)}`);
      }
    }
    for (const [key, value] of Object.entries(entry.safety ?? {})) {
      if (!CATEGORY_KEYS.has(key)) fail(`${at}.safety.${key}: not an iRacing category`);
      if (typeof value !== 'string' || !LICENCE_PATTERN.test(value)) {
        fail(`${at}.safety.${key}: must look like "A 4.20", got ${JSON.stringify(value)}`);
      }
    }
    if (entry.recent !== undefined) {
      if (!Array.isArray(entry.recent) || entry.recent.length > RECENT_LIMIT) {
        fail(`${at}.recent: must be an array of at most ${RECENT_LIMIT} races`);
        continue;
      }
      entry.recent.forEach((race, i) => {
        const row = `${at}.recent[${i}]`;
        if (!race || typeof race !== 'object') return fail(`${row}: must be an object`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(race.date))) fail(`${row}.date: must be an ISO date`);
        for (const field of ['series', 'track', 'car']) {
          if (typeof race[field] !== 'string' || !race[field].trim()) {
            fail(`${row}.${field}: must be a non-empty string`);
          }
        }
        for (const field of ['start', 'finish']) {
          if (!Number.isInteger(race[field]) || race[field] < 1 || race[field] > 999) {
            fail(`${row}.${field}: must be an integer 1-999, got ${JSON.stringify(race[field])}`);
          }
        }
        if (race.sof !== undefined && (!Number.isInteger(race.sof) || race.sof < 0)) {
          fail(`${row}.sof: must be a non-negative integer`);
        }
        if (race.incidents !== undefined && (!Number.isInteger(race.incidents) || race.incidents < 0)) {
          fail(`${row}.incidents: must be a non-negative integer`);
        }
        if (i > 0 && String(entry.recent[i - 1].date) < String(race.date)) {
          fail(`${row}.date: races must be newest first`);
        }
      });
    }
  }
  return problems;
}

/* HTTP: the network source ------------------------------------------- */

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function cookieHeader(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

function storeCookies(jar, response) {
  const raw =
    typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const list = raw.length ? raw : [response.headers.get('set-cookie')].filter(Boolean);
  for (const line of list) {
    const [pair] = String(line).split(';');
    const index = pair.indexOf('=');
    if (index > 0) jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
  return jar;
}

/**
 * The live API. `authenticate()` must run before `get()`; `get()` handles the
 * `{ link }` envelope, the documented rate-limit headers, and 429 backoff.
 */
export function createNetworkSource({ email, password, fetchImpl = globalThis.fetch, log = () => {} }) {
  const jar = new Map();
  let authenticated = false;

  async function request(url, init = {}, { attempt = 0 } = {}) {
    let response;
    try {
      response = await fetchImpl(url, init);
    } catch (error) {
      if (attempt < 2) {
        await sleep(1000 * 2 ** attempt);
        return request(url, init, { attempt: attempt + 1 });
      }
      throw new SyncError(`network error calling the iRacing API (${error.message})`, 3);
    }

    // Number(null) is 0, so a header that is absent must be read as "unknown"
    // rather than as a zero budget - otherwise every call would pause.
    const header = (name) => {
      const raw = response.headers.get(name);
      return raw === null || raw === '' ? NaN : Number(raw);
    };

    if (response.status === 429) {
      if (attempt >= 3) {
        throw new SyncError('iRacing rate limit did not clear after three retries', 3);
      }
      const retryAfter = header('retry-after');
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000 * 2 ** attempt;
      log(`rate limited, waiting ${Math.round(wait / 1000)}s`);
      await sleep(Math.min(wait, 60000));
      return request(url, init, { attempt: attempt + 1 });
    }

    // Documented budget headers: slow down before iRacing has to say no.
    const remaining = header('x-ratelimit-remaining');
    if (Number.isFinite(remaining) && remaining <= 2) {
      const reset = header('x-ratelimit-reset');
      const wait = Number.isFinite(reset) && reset > 0 ? reset * 1000 - Date.now() : 5000;
      if (wait > 0) {
        log(`rate-limit budget nearly spent, pausing ${Math.round(Math.min(wait, 60000) / 1000)}s`);
        await sleep(Math.min(wait, 60000));
      }
    }
    return response;
  }

  async function authenticate() {
    if (!email || !password) {
      throw new SyncError(
        'IRACING_EMAIL and IRACING_PASSWORD must be set (or use --fixture to run offline)',
        2
      );
    }
    const response = await request(AUTH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email, password: hashPassword(password, email) }),
    });

    let body = {};
    try {
      body = await response.json();
    } catch {
      /* an HTML error page: handled by the status checks below */
    }

    if (body?.verificationRequired === true) {
      throw new SyncError(
        'iRacing asked for a verification code: this account has two-factor (legacy) ' +
          'authentication enabled and cannot be used unattended. Disable 2FA on it, or point ' +
          'IRACING_EMAIL/IRACING_PASSWORD at a dedicated member account with legacy ' +
          'authentication allowed.',
        2
      );
    }
    if (response.status === 401 || response.status === 403 || body?.authcode === 0) {
      throw new SyncError(
        `iRacing rejected the login (HTTP ${response.status}${body?.message ? `: ${body.message}` : ''}). ` +
          'Check IRACING_EMAIL/IRACING_PASSWORD and that the account subscription is active.',
        2
      );
    }
    if (!response.ok) {
      throw new SyncError(`iRacing auth returned HTTP ${response.status}`, 2);
    }

    storeCookies(jar, response);
    if (jar.size === 0) {
      throw new SyncError('iRacing auth returned no session cookies, so no data call can be made', 2);
    }
    authenticated = true;
  }

  /** Follow the `{ link }` envelope: the S3 URL is pre-signed, send no cookies. */
  async function followLink(url) {
    const response = await request(url, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      throw new SyncError(`the iRacing data link returned HTTP ${response.status}`, 3);
    }
    return response.json();
  }

  async function get(path) {
    if (!authenticated) throw new SyncError('internal: get() called before authenticate()', 2);
    const response = await request(`${API_BASE}${path}`, {
      headers: { accept: 'application/json', cookie: cookieHeader(jar) },
    });
    if (response.status === 401) {
      throw new SyncError(`the iRacing session expired or was rejected on ${path}`, 2);
    }
    if (!response.ok) {
      throw new SyncError(`${path} returned HTTP ${response.status}`, 3);
    }
    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new SyncError(`${path} did not return JSON (${error.message})`, 3);
    }
    // Every /data endpoint answers with a pointer, never with the payload.
    if (body && typeof body === 'object' && typeof body.link === 'string') {
      return followLink(body.link);
    }
    return body;
  }

  return { authenticate, get, followLink, pause: () => sleep(DRIVER_DELAY_MS) };
}

/* The fixture source -------------------------------------------------- */

/** Which file in the fixture directory answers a given API path. */
export function fixtureFileForPath(path) {
  const member = /^\/data\/member\/get\?.*cust_ids=(\d+)/.exec(path);
  if (member) return `member-${member[1]}.json`;
  const recent = /^\/data\/stats\/member_recent_races\?.*cust_id=(\d+)/.exec(path);
  if (recent) return `recent-races-${recent[1]}.json`;
  if (path.startsWith('/data/car/get')) return 'cars.json';
  return null;
}

/** Offline stand-in for the API: same interface, JSON files instead of HTTP. */
export function createFixtureSource(dir) {
  return {
    async authenticate() {
      /* fixtures need no credentials */
    },
    async get(path) {
      const file = fixtureFileForPath(path);
      if (!file) throw new SyncError(`no fixture mapping for ${path}`, 3);
      const full = join(dir, file);
      if (!existsSync(full)) throw new SyncError(`missing fixture ${full} (for ${path})`, 3);
      return readJson(full, 'fixture');
    },
    async pause() {
      /* no rate limit offline */
    },
  };
}

/* Writing ------------------------------------------------------------- */

/**
 * Write only when something other than `updated` changed. The nightly workflow
 * commits whatever this touches, so a pure timestamp bump would mean a commit
 * (and a deploy) every night for no new information.
 */
export function writeIfChanged(outPath, document) {
  const json = serialise(document);
  if (existsSync(outPath)) {
    try {
      const previous = JSON.parse(readFileSync(outPath, 'utf8'));
      const before = serialise({ ...previous, updated: '' });
      const after = serialise({ ...document, updated: '' });
      if (before === after) return { wrote: false, json };
    } catch {
      /* unreadable or malformed: replace it */
    }
  }
  writeFileSync(outPath, json, 'utf8');
  return { wrote: true, json };
}

/* The run ------------------------------------------------------------- */

/**
 * Does the whole job and returns a result instead of exiting, so the tests can
 * call it directly. Never throws for an expected failure: SyncError is caught
 * and turned into `{ code, message }`.
 */
export async function run(options = {}) {
  const {
    fixture = null,
    dryRun = false,
    out = DEFAULT_OUT,
    now = new Date(),
    email = process.env.IRACING_EMAIL,
    password = process.env.IRACING_PASSWORD,
    fetchImpl = globalThis.fetch,
    log = () => {},
    warn = log,
  } = options;

  // A fixture directory may carry its own roster, because the real drivers.json
  // has no iracingId until the owner adds one.
  const fixtureRoster = fixture ? join(fixture, 'drivers.json') : null;
  const driversPath =
    options.drivers ?? (fixtureRoster && existsSync(fixtureRoster) ? fixtureRoster : DEFAULT_DRIVERS);

  try {
    const roster = readJson(driversPath, 'drivers.json');
    const drivers = selectDrivers(roster, warn);
    const document = { updated: timestamp(now), source: SOURCE, drivers: {} };

    if (drivers.length === 0) {
      log('no driver has an iracingId; writing an empty stats document');
    } else {
      const source = fixture
        ? createFixtureSource(fixture)
        : createNetworkSource({ email, password, fetchImpl, log });
      await source.authenticate();

      // One catalogue lookup for every driver; a failure here is not fatal.
      let carName = () => null;
      try {
        carName = carCatalogue(await source.get('/data/car/get'));
      } catch (error) {
        warn(`car catalogue unavailable, falling back to car ids (${error.message})`);
      }

      for (const [index, driver] of drivers.entries()) {
        if (index > 0) await source.pause();
        log(`fetching ${driver.id} (cust_id ${driver.iracingId})`);
        const member = await source.get(
          `/data/member/get?cust_ids=${driver.iracingId}&include_licenses=true`
        );
        const recent = await source.get(
          `/data/stats/member_recent_races?cust_id=${driver.iracingId}`
        );
        document.drivers[driver.id] = buildDriverEntry(driver, member, recent, carName, warn);
      }
    }

    const problems = validateDocument(document);
    if (problems.length) {
      return {
        code: 4,
        document,
        wrote: false,
        problems,
        message: `the document does not satisfy the data contract:\n  ${problems.join('\n  ')}`,
      };
    }

    if (dryRun) {
      return { code: 0, document, wrote: false, json: serialise(document), dryRun: true };
    }

    const { wrote, json } = writeIfChanged(out, document);
    return { code: 0, document, wrote, json, path: out };
  } catch (error) {
    if (error instanceof SyncError) {
      return { code: error.code, wrote: false, message: error.message };
    }
    throw error;
  }
}

/* CLI ----------------------------------------------------------------- */

export function parseArgs(argv) {
  const options = { dryRun: false, fixture: null, drivers: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) throw new SyncError(`${arg} needs a value`, 3);
      i += 1;
      return isAbsolute(next) ? next : resolve(process.cwd(), next);
    };
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--fixture') options.fixture = value();
    else if (arg === '--drivers') options.drivers = value();
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new SyncError(`unknown flag ${arg} (see --help)`, 3);
  }
  return options;
}

const USAGE = `Usage: node scripts/fetch-iracing.mjs [--dry-run] [--fixture <dir>] [--drivers <path>]

Writes src/data/stats.json from the iRacing /data API.
Credentials come from IRACING_EMAIL and IRACING_PASSWORD; --fixture needs none.
Exit codes: 0 ok, 2 auth failed, 3 API failed, 4 output invalid.`;

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`fetch-iracing: ${error.message}`);
    process.exit(error.code ?? 3);
  }
  if (options.help) {
    console.log(USAGE);
    return;
  }

  const result = await run({
    ...options,
    log: (message) => console.log(`fetch-iracing: ${message}`),
    warn: (message) => console.warn(`fetch-iracing: warning ${message}`),
  });

  if (result.code !== 0) {
    console.error(`fetch-iracing: ${result.message}`);
    process.exit(result.code);
  }
  if (result.dryRun) {
    process.stdout.write(result.json);
    const count = Object.keys(result.document.drivers).length;
    console.log(`fetch-iracing: dry run, nothing written (${count} driver${count === 1 ? '' : 's'}).`);
    return;
  }
  const count = Object.keys(result.document.drivers).length;
  console.log(
    result.wrote
      ? `fetch-iracing: wrote ${result.path} (${count} driver${count === 1 ? '' : 's'}).`
      : `fetch-iracing: unchanged, ${result.path} left alone (${count} driver${count === 1 ? '' : 's'}).`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`fetch-iracing: unexpected failure: ${error.stack ?? error.message}`);
    process.exit(3);
  });
}
