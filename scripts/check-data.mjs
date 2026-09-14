#!/usr/bin/env node
/**
 * Validates src/data/{results,drivers,events}.json against docs/data-contract.md.
 *
 * The Discord bot writes those three files straight to the deploy branch, so this
 * runs as `prebuild`: a bad write fails the build and the host keeps serving the
 * previous deployment instead of a broken page.
 *
 * Errors print as `file[index].field: message` and exit 1. Warnings print but do
 * not fail, because they describe things the site tolerates (a stale sort order,
 * a result naming a driver who is not on the roster).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src', 'data');

const errors = [];
const warnings = [];

const CLASSES = [
  'GTP',
  'LMP2',
  'GT3',
  'GT4',
  'TCR',
  'NASCAR Cup',
  'NASCAR Xfinity',
  'NASCAR Trucks',
  'ARCA',
  'Formula',
  'Other',
];
const ROLES = ['driver', 'pitwall', 'staff'];
const GROUPS = ['road', 'oval', 'crew'];
const STATUSES = ['planned', 'confirmed', 'done', 'skipped'];
const SOCIAL_KEYS = ['x', 'twitch', 'youtube', 'instagram'];

const ID = /^[a-z0-9-]{3,80}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY = /^[A-Z]{3}$/;
const NUMBER = /^\d{1,3}$/;
const LICENCE = /^[A-DRP] \d\.\d{2}$/;

/* Reporting --------------------------------------------------------- */

function fail(file, index, field, message) {
  errors.push(`${file}[${index}].${field}: ${message}`);
}

function warn(file, index, field, message) {
  warnings.push(`${file}[${index}].${field}: ${message}`);
}

/* Field checks ------------------------------------------------------ */

function checkString(file, i, field, value, { min, max, optional = false, mayBeEmpty = false }) {
  if (value === undefined || value === null) {
    if (!optional) fail(file, i, field, 'is required');
    return false;
  }
  if (typeof value !== 'string') {
    fail(file, i, field, `must be a string, got ${typeof value}`);
    return false;
  }
  if (value !== value.trim()) {
    fail(file, i, field, 'must not have leading or trailing whitespace');
    return false;
  }
  if (value === '') {
    if (!mayBeEmpty) fail(file, i, field, 'must not be empty');
    return mayBeEmpty;
  }
  if (min !== undefined && value.length < min) {
    fail(file, i, field, `must be at least ${min} characters, got ${value.length}`);
    return false;
  }
  if (max !== undefined && value.length > max) {
    fail(file, i, field, `must be at most ${max} characters, got ${value.length}`);
    return false;
  }
  return true;
}

function checkInteger(file, i, field, value, { min, max, optional = false }) {
  if (value === undefined || value === null) {
    if (!optional) fail(file, i, field, 'is required');
    return;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    fail(file, i, field, `must be an integer, got ${JSON.stringify(value)}`);
    return;
  }
  if (value < min || value > max) {
    fail(file, i, field, `must be between ${min} and ${max}, got ${value}`);
  }
}

function checkEnum(file, i, field, value, allowed) {
  if (!checkString(file, i, field, value, { min: 1 })) return;
  if (!allowed.includes(value)) {
    fail(file, i, field, `must be one of ${allowed.join(', ')}; got "${value}"`);
  }
}

function checkDate(file, i, field, value, { optional = false } = {}) {
  if (value === undefined) {
    if (!optional) fail(file, i, field, 'is required');
    return false;
  }
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    fail(file, i, field, `must be an ISO date (YYYY-MM-DD), got ${JSON.stringify(value)}`);
    return false;
  }
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    fail(file, i, field, `is not a real calendar date: ${value}`);
    return false;
  }
  return true;
}

function checkFlag(file, i, field, value) {
  if (value !== undefined && typeof value !== 'boolean') {
    fail(file, i, field, `must be true or false, got ${JSON.stringify(value)}`);
  }
}

function checkUrl(file, i, field, value) {
  if (value === '') return;
  if (typeof value !== 'string' || !value.startsWith('https://')) {
    fail(file, i, field, `must be an https URL or empty, got ${JSON.stringify(value)}`);
  }
}

/* File loading ------------------------------------------------------ */

function load(file) {
  let raw;
  try {
    raw = readFileSync(join(dataDir, file), 'utf8');
  } catch (error) {
    errors.push(`${file}: cannot be read (${error.code ?? error.message})`);
    return null;
  }
  if (!raw.endsWith('\n')) warnings.push(`${file}: should end with a newline`);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      errors.push(`${file}: must be a JSON array`);
      return null;
    }
    return parsed;
  } catch (error) {
    errors.push(`${file}: is not valid JSON (${error.message})`);
    return null;
  }
}

function checkIds(file, rows) {
  const seen = new Map();
  rows.forEach((row, i) => {
    if (!checkString(file, i, 'id', row.id, { min: 3, max: 80 })) return;
    if (!ID.test(row.id)) {
      fail(file, i, 'id', 'must be a lowercase slug matching [a-z0-9-]{3,80}');
      return;
    }
    if (seen.has(row.id)) {
      fail(file, i, 'id', `duplicates ${file}[${seen.get(row.id)}].id ("${row.id}")`);
      return;
    }
    seen.set(row.id, i);
  });
}

function checkOrder(file, rows, compare) {
  for (let i = 1; i < rows.length; i += 1) {
    if (compare(rows[i - 1], rows[i]) > 0) {
      warn(file, i, 'order', 'is out of the contract sort order (the site re-sorts, the bot rewrites)');
      return;
    }
  }
}

/* results.json ------------------------------------------------------ */

function checkResults(rows) {
  const file = 'results.json';
  const horizon = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  checkIds(file, rows);

  rows.forEach((row, i) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      errors.push(`${file}[${i}]: must be an object`);
      return;
    }
    if (checkDate(file, i, 'date', row.date) && row.date > horizon) {
      fail(file, i, 'date', `is more than a day in the future (${row.date})`);
    }
    checkString(file, i, 'event', row.event, { min: 2, max: 80 });
    checkString(file, i, 'track', row.track, { min: 2, max: 80 });
    checkString(file, i, 'series', row.series, { min: 2, max: 60 });
    checkEnum(file, i, 'class', row.class, CLASSES);
    checkInteger(file, i, 'position', row.position, { min: 1, max: 99 });
    checkInteger(file, i, 'entries', row.entries, { min: 2, max: 999, optional: true });
    if (
      typeof row.position === 'number' &&
      typeof row.entries === 'number' &&
      row.position > row.entries
    ) {
      fail(file, i, 'position', `cannot be worse than the field size (P${row.position} of ${row.entries})`);
    }
    if (!Array.isArray(row.drivers)) {
      fail(file, i, 'drivers', 'must be an array of 1 to 6 names');
    } else if (row.drivers.length < 1 || row.drivers.length > 6) {
      fail(file, i, 'drivers', `must hold 1 to 6 names, got ${row.drivers.length}`);
    } else {
      row.drivers.forEach((name, n) =>
        checkString(file, i, `drivers[${n}]`, name, { min: 2, max: 40 })
      );
    }
    checkString(file, i, 'note', row.note, { max: 140, optional: true });
    checkFlag(file, i, '_placeholder', row._placeholder);
  });

  checkOrder(file, rows, (a, b) =>
    b.date.localeCompare(a.date) || (a.position ?? 0) - (b.position ?? 0)
  );
}

/* drivers.json ------------------------------------------------------ */

function checkDrivers(rows) {
  const file = 'drivers.json';
  checkIds(file, rows);

  rows.forEach((row, i) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      errors.push(`${file}[${i}]: must be an object`);
      return;
    }
    checkString(file, i, 'name', row.name, { min: 2, max: 40 });
    checkEnum(file, i, 'role', row.role, ROLES);
    checkEnum(file, i, 'group', row.group, GROUPS);

    if (typeof row.number !== 'string') {
      fail(file, i, 'number', 'must be a string of 1 to 3 digits, or empty for crew');
    } else if (row.number === '') {
      if (row.group !== 'crew') fail(file, i, 'number', 'may only be empty for the crew group');
    } else if (!NUMBER.test(row.number)) {
      fail(file, i, 'number', `must be 1 to 3 digits, got "${row.number}"`);
    }

    if (typeof row.country !== 'string' || !COUNTRY.test(row.country)) {
      fail(file, i, 'country', `must be an uppercase ISO 3166-1 alpha-3 code, got ${JSON.stringify(row.country)}`);
    }
    checkString(file, i, 'focus', row.focus, { min: 2, max: 40 });
    checkString(file, i, 'bio', row.bio, { max: 140, optional: true, mayBeEmpty: true });

    if (row.stats !== undefined) {
      if (typeof row.stats !== 'object' || row.stats === null || Array.isArray(row.stats)) {
        fail(file, i, 'stats', 'must be an object');
      } else {
        checkInteger(file, i, 'stats.irating', row.stats.irating, {
          min: 0,
          max: 15000,
          optional: true,
        });
        if (row.stats.licence !== undefined && !LICENCE.test(String(row.stats.licence))) {
          fail(file, i, 'stats.licence', `must look like "A 4.20", got ${JSON.stringify(row.stats.licence)}`);
        }
      }
    }

    if (row.socials !== undefined) {
      if (typeof row.socials !== 'object' || row.socials === null || Array.isArray(row.socials)) {
        fail(file, i, 'socials', 'must be an object');
      } else {
        for (const [key, url] of Object.entries(row.socials)) {
          if (!SOCIAL_KEYS.includes(key)) {
            fail(file, i, `socials.${key}`, `is not a known channel (${SOCIAL_KEYS.join(', ')})`);
            continue;
          }
          checkUrl(file, i, `socials.${key}`, url);
        }
      }
    }

    checkFlag(file, i, 'active', row.active);
    checkFlag(file, i, '_placeholder', row._placeholder);
  });

  const order = ['road', 'oval', 'crew'];
  checkOrder(file, rows, (a, b) => {
    const group = order.indexOf(a.group) - order.indexOf(b.group);
    if (group !== 0) return group;
    if (a.group === 'crew') return String(a.name).localeCompare(String(b.name));
    return Number(a.number || 0) - Number(b.number || 0);
  });
}

/* events.json ------------------------------------------------------- */

function checkEvents(rows) {
  const file = 'events.json';
  checkIds(file, rows);

  rows.forEach((row, i) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      errors.push(`${file}[${i}]: must be an object`);
      return;
    }
    checkString(file, i, 'name', row.name, { min: 2, max: 80 });
    checkString(file, i, 'track', row.track, { min: 2, max: 80 });
    const start = checkDate(file, i, 'start', row.start);
    const end = checkDate(file, i, 'end', row.end, { optional: true });
    if (start && end && row.end < row.start) {
      fail(file, i, 'end', `must not be before start (${row.end} < ${row.start})`);
    }
    if (!Array.isArray(row.classes)) {
      fail(file, i, 'classes', 'must be an array of 1 to 4 class names');
    } else if (row.classes.length < 1 || row.classes.length > 4) {
      fail(file, i, 'classes', `must hold 1 to 4 values, got ${row.classes.length}`);
    } else {
      row.classes.forEach((name, n) => checkEnum(file, i, `classes[${n}]`, name, CLASSES));
    }
    checkEnum(file, i, 'status', row.status, STATUSES);
    checkString(file, i, 'note', row.note, { max: 140, optional: true });
    checkFlag(file, i, '_placeholder', row._placeholder);
  });

  checkOrder(file, rows, (a, b) => String(a.start).localeCompare(String(b.start)));
}

/* Cross-file sanity -------------------------------------------------- */

function checkDriverNames(results, drivers) {
  if (!results || !drivers) return;
  const roster = new Set(drivers.map((driver) => driver.name));
  results.forEach((row, i) => {
    if (!Array.isArray(row.drivers)) return;
    row.drivers.forEach((name, n) => {
      if (!roster.has(name)) {
        warn(
          'results.json',
          i,
          `drivers[${n}]`,
          `"${name}" is not a name in drivers.json, so no "last drive" line will show for them`
        );
      }
    });
  });
}

/* Run ---------------------------------------------------------------- */

const results = load('results.json');
const drivers = load('drivers.json');
const events = load('events.json');

if (results) checkResults(results);
if (drivers) checkDrivers(drivers);
if (events) checkEvents(events);
checkDriverNames(results, drivers);

/* An empty file is contract-valid and the site renders a deliberate empty
   state for each one, so this is a warning and never a failure. It is here so
   that "the results section is gone" is explained in the build log rather
   than diagnosed from the deployed page. */
for (const [name, list] of [
  ['results.json', results],
  ['drivers.json', drivers],
  ['events.json', events],
]) {
  if (Array.isArray(list) && list.length === 0) {
    warnings.push(`${name}: file is empty; the site will render its empty state for this section.`);
  }
}

for (const line of warnings) console.warn(`warning  ${line}`);

if (errors.length) {
  for (const line of errors) console.error(`error    ${line}`);
  console.error(
    `\ncheck:data failed with ${errors.length} error${errors.length === 1 ? '' : 's'}. ` +
      'See docs/data-contract.md for the rules.'
  );
  process.exit(1);
}

const counts = [
  results ? `${results.length} results` : null,
  drivers ? `${drivers.length} drivers` : null,
  events ? `${events.length} events` : null,
]
  .filter(Boolean)
  .join(', ');
console.log(`check:data passed (${counts}).`);
