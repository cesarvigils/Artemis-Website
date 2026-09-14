/**
 * serialize.js
 *
 * Sorting and file formatting, per the data contract:
 *
 *   results : date descending, then position ascending
 *   drivers : group order road, oval, crew; then number numeric ascending
 *             (the crew group is ordered by name)
 *   events  : start ascending
 *
 * Format: UTF-8, JSON array, 2-space indent, LF line endings, trailing newline.
 * The bot writes this shape exactly so that diffs against hand edits stay small.
 *
 * Record keys are written in contract order. Unknown keys added by a human are
 * preserved and appended after the known ones, in their original order.
 */

import { GROUP_ORDER, KEY_ORDER } from './schema.js';

/**
 * Compare two strings so that sorting is stable across platforms.
 * (localeCompare would depend on the host locale, which we do not want in a file.)
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareText(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Numeric value of a driver number. Empty or non-numeric sorts last.
 * @param {unknown} value
 * @returns {number}
 */
function numberValue(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

/** Comparator for results.json. */
function compareResults(a, b) {
  // date descending
  const byDate = compareText(b.date, a.date);
  if (byDate !== 0) return byDate;
  // position ascending
  const byPosition = numberValue(a.position) - numberValue(b.position);
  if (byPosition !== 0) return byPosition;
  // id ascending, so the order is fully determined
  return compareText(a.id, b.id);
}

/** Comparator for drivers.json. */
function compareDrivers(a, b) {
  const groupA = GROUP_ORDER.indexOf(String(a.group));
  const groupB = GROUP_ORDER.indexOf(String(b.group));
  const byGroup = (groupA === -1 ? GROUP_ORDER.length : groupA) - (groupB === -1 ? GROUP_ORDER.length : groupB);
  if (byGroup !== 0) return byGroup;
  // The crew group has no numbers, so it is ordered by name.
  if (String(a.group) === 'crew' && String(b.group) === 'crew') {
    const byName = compareText(a.name, b.name);
    if (byName !== 0) return byName;
    return compareText(a.id, b.id);
  }
  const byNumber = numberValue(a.number) - numberValue(b.number);
  if (byNumber !== 0) return byNumber;
  const byName = compareText(a.name, b.name);
  if (byName !== 0) return byName;
  return compareText(a.id, b.id);
}

/** Comparator for events.json. */
function compareEvents(a, b) {
  const byStart = compareText(a.start, b.start);
  if (byStart !== 0) return byStart;
  const byName = compareText(a.name, b.name);
  if (byName !== 0) return byName;
  return compareText(a.id, b.id);
}

const COMPARATORS = {
  results: compareResults,
  drivers: compareDrivers,
  events: compareEvents,
};

/**
 * Sort a copy of the records for one file. The input array is not modified.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Array<Record<string, any>>} records
 * @returns {Array<Record<string, any>>} a new, sorted array
 */
export function sortRecords(kind, records) {
  const comparator = COMPARATORS[kind];
  if (!comparator) throw new Error(`Unknown record kind: ${kind}`);
  return [...records].sort(comparator);
}

/**
 * Rewrite one record with the contract key order, keeping unknown keys.
 * Nested objects (stats, socials) keep their own order as stored.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Record<string, any>} record
 * @returns {Record<string, any>}
 */
export function orderKeys(kind, record) {
  const order = KEY_ORDER[kind];
  if (!order) throw new Error(`Unknown record kind: ${kind}`);
  const out = {};
  for (const key of order) {
    if (Object.prototype.hasOwnProperty.call(record, key)) out[key] = record[key];
  }
  for (const key of Object.keys(record)) {
    if (!Object.prototype.hasOwnProperty.call(out, key)) out[key] = record[key];
  }
  return out;
}

/**
 * Produce the exact text that goes into the data file.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Array<Record<string, any>>} records
 * @returns {string} JSON text, 2-space indent, LF endings, trailing newline
 */
export function serialize(kind, records) {
  const ordered = sortRecords(kind, records).map((record) => orderKeys(kind, record));
  // JSON.stringify indents with LF on every platform, and escapes any control
  // character inside a value, so the file is pure LF without further work. A
  // carriage return pasted into a value survives as the escape sequence \r,
  // which keeps a hand edit intact rather than quietly rewriting it.
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

/**
 * Parse the text of a data file.
 * @param {string} text
 * @param {string} label file name, used in the error message
 * @returns {Array<Record<string, any>>}
 * @throws {Error} when the text is not JSON, or not an array
 */
export function parseFile(text, label = 'data file') {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed)) throw new Error(`${label} must contain a JSON array`);
  return parsed;
}
