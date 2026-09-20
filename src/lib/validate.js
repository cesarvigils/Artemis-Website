/**
 * validate.js
 *
 * Full validation of the three record types and of whole files, following the
 * Artemis data contract (version 1.2).
 *
 * Every function that checks a whole file returns:
 *   { ok: boolean, errors: string[] }
 * where each error reads "file[index].field: message", for example
 *   "results.json[3].position: must be a whole number between 1 and 99"
 *
 * Sort order is NOT checked: the writer applies it (see serialize.js), so a file
 * that a human edited by hand is still accepted as long as the records are valid.
 */

import {
  BIO_MAX,
  CLASS_VALUES,
  COUNTRY_PATTERN,
  DATE_PATTERN,
  ENTRIES_MAX,
  ENTRIES_MIN,
  FILES,
  GROUP_VALUES,
  ID_PATTERN,
  IRACING_ID_MAX,
  IRACING_ID_MIN,
  LICENCE_PATTERN,
  NOTE_MAX,
  NUMBER_PATTERN,
  ROLE_VALUES,
  SOCIAL_KEYS,
  START_TIME_PATTERN,
  STATUS_VALUES,
} from './schema.js';

/**
 * Collects errors for one record so the checks below stay readable.
 */
class ErrorBag {
  /**
   * @param {string} prefix for example "results.json[3]"
   */
  constructor(prefix) {
    this.prefix = prefix;
    this.errors = [];
  }

  /**
   * @param {string} field dotted field path, for example "stats.irating"
   * @param {string} message plain sentence, no leading capital needed
   */
  add(field, message) {
    this.errors.push(`${this.prefix}.${field}: ${message}`);
  }
}

/**
 * @param {unknown} value
 * @returns {boolean} true for a non-null, non-array object
 */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * True when the text is an ISO calendar date that really exists.
 * Rejects "2026-02-30" and "2026-13-01".
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * The latest date a result may carry: today plus one day, in UTC.
 * The contract allows one day of slack so a race that finished on the far side
 * of the date line can still be entered.
 * @param {Date} [now]
 * @returns {string}
 */
export function maxResultDate(now = new Date()) {
  const limit = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return limit.toISOString().slice(0, 10);
}

/**
 * Check a required string field with a length range.
 * @param {ErrorBag} bag
 * @param {Record<string, any>} record
 * @param {string} field
 * @param {number} min
 * @param {number} max
 */
function requireString(bag, record, field, min, max) {
  const value = record[field];
  if (typeof value !== 'string') {
    bag.add(field, 'is required and must be text');
    return;
  }
  if (value !== value.trim()) {
    bag.add(field, 'must not start or end with a space');
    return;
  }
  if (value.length < min || value.length > max) {
    bag.add(field, `must be between ${min} and ${max} characters`);
  }
}

/**
 * Check an optional string field with a maximum length.
 * @param {ErrorBag} bag
 * @param {Record<string, any>} record
 * @param {string} field
 * @param {number} max
 * @param {{ mayBeEmpty?: boolean }} [options]
 */
function optionalString(bag, record, field, max, options = {}) {
  if (!Object.prototype.hasOwnProperty.call(record, field) || record[field] === undefined) return;
  const value = record[field];
  if (typeof value !== 'string') {
    bag.add(field, 'must be text when present');
    return;
  }
  if (value !== value.trim()) {
    bag.add(field, 'must not start or end with a space');
    return;
  }
  if (value.length === 0 && !options.mayBeEmpty) {
    bag.add(field, 'must not be empty; leave the field out instead');
    return;
  }
  if (value.length > max) bag.add(field, `must be at most ${max} characters`);
}

/**
 * True when the text is a full ISO 8601 UTC timestamp with a real date and a
 * real time, for example "2026-09-25T14:00:00Z".
 * @param {unknown} value
 * @returns {boolean}
 */
export function isIsoUtcTimestamp(value) {
  if (typeof value !== 'string' || !START_TIME_PATTERN.test(value)) return false;
  return isIsoDate(value.slice(0, 10));
}

/**
 * Check a value against a fixed list.
 * @param {ErrorBag} bag
 * @param {Record<string, any>} record
 * @param {string} field
 * @param {readonly string[]} allowed
 */
function requireChoice(bag, record, field, allowed) {
  const value = record[field];
  if (typeof value !== 'string' || !allowed.includes(value)) {
    bag.add(field, `must be one of: ${allowed.join(', ')}`);
  }
}

/**
 * Check the id field.
 * @param {ErrorBag} bag
 * @param {Record<string, any>} record
 */
function requireId(bag, record) {
  const value = record.id;
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    bag.add('id', 'must be a lowercase slug of 3 to 80 characters using a-z, 0-9 and hyphen');
  }
}

/**
 * Check the optional _placeholder flag.
 * @param {ErrorBag} bag
 * @param {Record<string, any>} record
 */
function optionalPlaceholder(bag, record) {
  if (!Object.prototype.hasOwnProperty.call(record, '_placeholder')) return;
  if (typeof record._placeholder !== 'boolean') bag.add('_placeholder', 'must be true or false when present');
}

/**
 * Validate one result record.
 *
 * @param {unknown} record
 * @param {{ prefix?: string, now?: Date }} [options]
 * @returns {string[]} error messages, empty when the record is valid
 */
export function validateResult(record, options = {}) {
  const bag = new ErrorBag(options.prefix ?? 'results.json[0]');
  if (!isPlainObject(record)) return [`${bag.prefix}: must be a JSON object`];

  requireId(bag, record);

  if (!isIsoDate(record.date)) {
    bag.add('date', 'must be a real date in YYYY-MM-DD form');
  } else if (record.date > maxResultDate(options.now)) {
    bag.add('date', `must not be more than one day in the future (latest allowed is ${maxResultDate(options.now)})`);
  }

  requireString(bag, record, 'event', 2, 80);
  requireString(bag, record, 'track', 2, 80);
  requireString(bag, record, 'series', 2, 60);
  requireChoice(bag, record, 'class', CLASS_VALUES);

  const position = record.position;
  if (!Number.isInteger(position) || position < 1 || position > 99) {
    bag.add('position', 'must be a whole number between 1 and 99');
  }

  // entries is optional: the number of cars in the class or split, used by the
  // site to render a finish as "P4 / 41".
  if (Object.prototype.hasOwnProperty.call(record, 'entries') && record.entries !== undefined) {
    const entries = record.entries;
    if (!Number.isInteger(entries) || entries < ENTRIES_MIN || entries > ENTRIES_MAX) {
      bag.add('entries', `must be a whole number between ${ENTRIES_MIN} and ${ENTRIES_MAX} when present`);
    } else if (Number.isInteger(position) && position > entries) {
      // The website's build check rejects this, so accepting it here would let
      // the bot commit a file that cannot be deployed.
      bag.add('position', `cannot be worse than the field size (P${position} of ${entries})`);
    }
  }

  const drivers = record.drivers;
  if (!Array.isArray(drivers)) {
    bag.add('drivers', 'must be a list of 1 to 6 driver names');
  } else if (drivers.length < 1 || drivers.length > 6) {
    bag.add('drivers', `must hold 1 to 6 names, found ${drivers.length}`);
  } else {
    drivers.forEach((name, index) => {
      if (typeof name !== 'string' || name !== name.trim() || name.length < 2 || name.length > 40) {
        bag.add(`drivers[${index}]`, 'must be a trimmed name of 2 to 40 characters');
      }
    });
  }

  optionalString(bag, record, 'note', NOTE_MAX);
  optionalPlaceholder(bag, record);

  return bag.errors;
}

/**
 * Validate one driver record.
 *
 * Note on role and group: the contract says crew is used for pitwall and staff.
 * That pairing is documented and suggested by the commands, but it is not
 * enforced here, so a file a human edited by hand is never rejected for it.
 *
 * @param {unknown} record
 * @param {{ prefix?: string }} [options]
 * @returns {string[]}
 */
export function validateDriver(record, options = {}) {
  const bag = new ErrorBag(options.prefix ?? 'drivers.json[0]');
  if (!isPlainObject(record)) return [`${bag.prefix}: must be a JSON object`];

  requireId(bag, record);
  requireString(bag, record, 'name', 2, 40);
  requireChoice(bag, record, 'role', ROLE_VALUES);
  requireChoice(bag, record, 'group', GROUP_VALUES);

  const number = record.number;
  const isCrew = record.group === 'crew';
  if (typeof number !== 'string') {
    bag.add('number', isCrew ? 'must be text, and may be empty for crew' : 'must be 1 to 3 digits');
  } else if (number.length === 0) {
    if (!isCrew) bag.add('number', 'must be 1 to 3 digits for road and oval drivers');
  } else if (!NUMBER_PATTERN.test(number)) {
    bag.add('number', 'must be 1 to 3 digits, written as text');
  }

  if (typeof record.country !== 'string' || !COUNTRY_PATTERN.test(record.country)) {
    bag.add('country', 'must be a three letter uppercase country code, for example USA or GBR');
  }

  requireString(bag, record, 'focus', 2, 40);
  optionalString(bag, record, 'bio', BIO_MAX, { mayBeEmpty: true });

  if (Object.prototype.hasOwnProperty.call(record, 'stats') && record.stats !== undefined) {
    if (!isPlainObject(record.stats)) {
      bag.add('stats', 'must be an object when present');
    } else {
      const { irating, licence } = record.stats;
      if (irating !== undefined) {
        if (!Number.isInteger(irating) || irating < 0 || irating > 15000) {
          bag.add('stats.irating', 'must be a whole number between 0 and 15000 when present');
        }
      }
      if (licence !== undefined) {
        if (typeof licence !== 'string' || !LICENCE_PATTERN.test(licence)) {
          bag.add('stats.licence', 'must look like "A 4.20" when present');
        }
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(record, 'socials') && record.socials !== undefined) {
    if (!isPlainObject(record.socials)) {
      bag.add('socials', 'must be an object when present');
    } else {
      // Every key is checked, not just the known ones: the website's build
      // check rejects an unrecognised channel, so ignoring it here would let
      // the bot report a file as valid that cannot be deployed.
      for (const key of Object.keys(record.socials)) {
        const value = record.socials[key];
        if (value === undefined) continue;
        if (!SOCIAL_KEYS.includes(key)) {
          bag.add(`socials.${key}`, `is not a known channel; use one of: ${SOCIAL_KEYS.join(', ')}`);
        } else if (typeof value !== 'string') {
          bag.add(`socials.${key}`, 'must be text when present');
        } else if (value.length > 0 && !/^https:\/\/\S+$/.test(value)) {
          bag.add(`socials.${key}`, 'must be an https link, or empty');
        }
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(record, 'active') && typeof record.active !== 'boolean') {
    bag.add('active', 'must be true or false');
  }

  // iracingId: optional, the driver's iRacing customer id. When present, the
  // nightly sync fills in stats.json for this driver (see docs/data-contract.md).
  if (Object.prototype.hasOwnProperty.call(record, 'iracingId') && record.iracingId !== undefined) {
    const iracingId = record.iracingId;
    if (!Number.isInteger(iracingId) || iracingId < IRACING_ID_MIN || iracingId > IRACING_ID_MAX) {
      bag.add('iracingId', `must be a whole number between ${IRACING_ID_MIN} and ${IRACING_ID_MAX} when present`);
    }
  }

  optionalPlaceholder(bag, record);

  return bag.errors;
}

/**
 * Validate one event record.
 * @param {unknown} record
 * @param {{ prefix?: string }} [options]
 * @returns {string[]}
 */
export function validateEvent(record, options = {}) {
  const bag = new ErrorBag(options.prefix ?? 'events.json[0]');
  if (!isPlainObject(record)) return [`${bag.prefix}: must be a JSON object`];

  requireId(bag, record);
  requireString(bag, record, 'name', 2, 80);
  requireString(bag, record, 'track', 2, 80);

  if (!isIsoDate(record.start)) bag.add('start', 'must be a real date in YYYY-MM-DD form');

  if (Object.prototype.hasOwnProperty.call(record, 'end') && record.end !== undefined) {
    if (!isIsoDate(record.end)) {
      bag.add('end', 'must be a real date in YYYY-MM-DD form when present');
    } else if (isIsoDate(record.start) && record.end < record.start) {
      bag.add('end', 'must not be earlier than start');
    }
  }

  // startTime: optional green-flag time as a full ISO 8601 UTC timestamp. Its
  // date part must equal start, so the countdown and the calendar day agree.
  if (Object.prototype.hasOwnProperty.call(record, 'startTime') && record.startTime !== undefined) {
    if (!isIsoUtcTimestamp(record.startTime)) {
      bag.add('startTime', 'must be a real ISO 8601 UTC timestamp like 2026-09-25T14:00:00Z when present');
    } else if (isIsoDate(record.start) && record.startTime.slice(0, 10) !== record.start) {
      bag.add('startTime', 'date part must equal start');
    }
  }

  const classes = record.classes;
  if (!Array.isArray(classes)) {
    bag.add('classes', 'must be a list of 1 to 4 classes');
  } else if (classes.length < 1 || classes.length > 4) {
    bag.add('classes', `must hold 1 to 4 classes, found ${classes.length}`);
  } else {
    classes.forEach((value, index) => {
      if (typeof value !== 'string' || !CLASS_VALUES.includes(value)) {
        bag.add(`classes[${index}]`, `must be one of: ${CLASS_VALUES.join(', ')}`);
      }
    });
    const unique = new Set(classes.map(String));
    if (unique.size !== classes.length) bag.add('classes', 'must not repeat a class');
  }

  requireChoice(bag, record, 'status', STATUS_VALUES);
  optionalString(bag, record, 'note', NOTE_MAX);
  optionalPlaceholder(bag, record);

  return bag.errors;
}

/** Map of kind -> single record validator. */
export const RECORD_VALIDATORS = Object.freeze({
  results: validateResult,
  drivers: validateDriver,
  events: validateEvent,
});

/**
 * Validate one record of a given kind.
 * @param {'results'|'drivers'|'events'} kind
 * @param {unknown} record
 * @param {{ prefix?: string, now?: Date }} [options]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRecord(kind, record, options = {}) {
  const validator = RECORD_VALIDATORS[kind];
  if (!validator) throw new Error(`Unknown record kind: ${kind}`);
  const prefix = options.prefix ?? `${FILES[kind]}[0]`;
  const errors = validator(record, { ...options, prefix });
  return { ok: errors.length === 0, errors };
}

/**
 * Validate a whole file: every record, plus id uniqueness across the array.
 *
 * @param {'results'|'drivers'|'events'} kind
 * @param {unknown} records the parsed JSON array
 * @param {{ label?: string, now?: Date }} [options] label defaults to the file name
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateArray(kind, records, options = {}) {
  const label = options.label ?? FILES[kind];
  const validator = RECORD_VALIDATORS[kind];
  if (!validator) throw new Error(`Unknown record kind: ${kind}`);

  if (!Array.isArray(records)) {
    return { ok: false, errors: [`${label}: must contain a JSON array`] };
  }

  const errors = [];
  const seen = new Map();
  // The nightly iRacing sync keys stats.json by driver id, so two drivers may
  // not be the same iRacing member. The website's build check rejects it.
  const seenIracingIds = new Map();

  records.forEach((record, index) => {
    const prefix = `${label}[${index}]`;
    errors.push(...validator(record, { prefix, now: options.now }));
    const id = isPlainObject(record) ? record.id : undefined;
    if (typeof id === 'string' && id.length > 0) {
      if (seen.has(id)) {
        errors.push(`${prefix}.id: duplicate id "${id}", already used at index ${seen.get(id)}`);
      } else {
        seen.set(id, index);
      }
    }

    if (kind !== 'drivers') return;
    const iracingId = isPlainObject(record) ? record.iracingId : undefined;
    if (!Number.isInteger(iracingId)) return;
    const first = seenIracingIds.get(iracingId);
    if (first !== undefined) {
      errors.push(
        `${prefix}.iracingId: duplicate iRacing id ${iracingId}, already used at index ${first}`
      );
    } else {
      seenIracingIds.set(iracingId, index);
    }
  });

  return { ok: errors.length === 0, errors };
}

/**
 * Validate several files at once.
 * @param {Record<string, unknown[]>} filesByKind for example { results: [...], drivers: [...] }
 * @param {{ now?: Date }} [options]
 * @returns {{ ok: boolean, errors: string[], counts: Record<string, number> }}
 */
export function validateAll(filesByKind, options = {}) {
  const errors = [];
  const counts = {};
  for (const [kind, records] of Object.entries(filesByKind)) {
    counts[kind] = Array.isArray(records) ? records.length : 0;
    errors.push(...validateArray(/** @type {any} */ (kind), records, options).errors);
  }
  return { ok: errors.length === 0, errors, counts };
}
