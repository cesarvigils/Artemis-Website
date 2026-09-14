/**
 * ids.js
 *
 * Default id generation and de-duplication, per the data contract:
 *
 *   results : <date>-<slug(event)>-<slug(class)>
 *   drivers : slug(name)
 *   events  : <start>-<slug(name)>
 *
 * If the generated id is already taken, "-2", "-3", ... is appended until it is
 * free. Ids are immutable once written (remove and add again to change one), so
 * these functions are only used when a record is created without an explicit id.
 */

import { slug, slugJoin } from './slug.js';
import { ID_PATTERN, SINGULAR } from './schema.js';

/** Longest id the contract allows. */
const MAX_ID = 80;

/** Shortest id the contract allows. */
const MIN_ID = 3;

/**
 * Build the default id for a record, before de-duplication.
 *
 * @param {'results'|'drivers'|'events'} kind
 * @param {Record<string, unknown>} record a record that already has its fields set
 * @returns {string} a slug that matches the id pattern
 */
export function defaultId(kind, record) {
  let base;
  switch (kind) {
    case 'results':
      base = slugJoin(record.date, record.event, record.class);
      break;
    case 'drivers':
      base = slug(record.name);
      break;
    case 'events':
      base = slugJoin(record.start, record.name);
      break;
    default:
      throw new Error(`Unknown record kind: ${kind}`);
  }
  return padId(base, kind);
}

/**
 * Make sure a base id is long enough to be valid. A name such as "Al" slugs to
 * two characters, which the contract rejects, so the record kind is appended.
 *
 * @param {string} base
 * @param {'results'|'drivers'|'events'} kind
 * @returns {string}
 */
function padId(base, kind) {
  let out = base;
  if (!out) out = SINGULAR[kind] || 'record';
  while (out.length < MIN_ID) out = `${out}-${SINGULAR[kind] || 'record'}`;
  return out.slice(0, MAX_ID).replace(/-+$/, '');
}

/**
 * Return an id that is not present in `taken`, appending -2, -3, ... if needed.
 * The base is shortened when necessary so the result never exceeds 80 characters.
 *
 * @param {string} base a slug produced by defaultId or supplied by an operator
 * @param {Iterable<string>} taken ids already used in the file
 * @returns {string}
 */
export function uniqueId(base, taken = []) {
  const used = taken instanceof Set ? taken : new Set(taken);
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const tail = `-${suffix}`;
    const trimmed = base.slice(0, MAX_ID - tail.length).replace(/-+$/, '');
    const candidate = `${trimmed}${tail}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error(`Could not find a free id based on "${base}" after 1000 attempts`);
}

/**
 * Full path from a new record to its final id.
 *
 * @param {'results'|'drivers'|'events'} kind
 * @param {Record<string, unknown>} record
 * @param {Iterable<string>} existingIds ids already in the file
 * @param {string} [explicitId] id typed by the operator; used instead of the default
 * @returns {string}
 */
export function makeId(kind, record, existingIds = [], explicitId) {
  const base = explicitId ? slug(explicitId) : defaultId(kind, record);
  return uniqueId(padId(base, kind), existingIds);
}

/**
 * Collect the ids of an array of records.
 * @param {Array<Record<string, unknown>>} records
 * @returns {Set<string>}
 */
export function idSet(records) {
  return new Set(records.map((record) => String(record?.id ?? '')).filter(Boolean));
}

/**
 * Check an id against the contract pattern.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/**
 * Find a record by id.
 * @param {Array<Record<string, unknown>>} records
 * @param {string} id
 * @returns {number} index, or -1 when there is no such record
 */
export function indexOfId(records, id) {
  return records.findIndex((record) => record?.id === id);
}
