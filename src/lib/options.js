/**
 * options.js
 *
 * Turns raw slash command option values into the exact shapes the data contract
 * wants, and refuses bad input with a message an operator can act on.
 *
 * These functions never touch Discord or the network, so they are covered
 * directly by the tests in test/options.test.js.
 */

import { BotError } from './errors.js';
import {
  CLASS_VALUES,
  COUNTRY_PATTERN,
  DATE_PATTERN,
  ENTRIES_MAX,
  ENTRIES_MIN,
  LICENCE_PATTERN,
  NUMBER_PATTERN,
} from './schema.js';
import { isIsoDate, maxResultDate } from './validate.js';

/**
 * Refuse an option value.
 * @param {string} field
 * @param {string} message
 * @param {string[]} [details]
 * @returns {never}
 */
function reject(field, message, details = []) {
  throw new BotError(`The ${field} option ${message}`, { title: 'Invalid input', details });
}

/**
 * Trim a text option. Returns undefined when nothing usable was supplied.
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function trimOption(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Split a comma separated list of names, trimming each entry and dropping empties.
 *
 *   "Matthew Blackley, Nolan Walker" -> ["Matthew Blackley", "Nolan Walker"]
 *   "Solo,,  "                       -> ["Solo"]
 *
 * @param {unknown} value the raw option text
 * @param {{ field?: string, min?: number, max?: number, minLength?: number, maxLength?: number }} [options]
 * @returns {string[]}
 */
export function parseNameList(value, options = {}) {
  const field = options.field ?? 'drivers';
  const min = options.min ?? 1;
  const max = options.max ?? 6;
  const minLength = options.minLength ?? 2;
  const maxLength = options.maxLength ?? 40;

  const names = String(value ?? '')
    .split(',')
    .map((name) => name.trim().replace(/\s+/g, ' '))
    .filter((name) => name.length > 0);

  if (names.length < min) {
    reject(field, `needs at least ${min} name(s), separated by commas.`);
  }
  if (names.length > max) {
    reject(field, `takes at most ${max} name(s), found ${names.length}.`);
  }
  for (const name of names) {
    if (name.length < minLength || name.length > maxLength) {
      reject(field, `has an entry that is not between ${minLength} and ${maxLength} characters: "${name}".`);
    }
  }
  const seen = new Set();
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) reject(field, `lists "${name}" twice.`);
    seen.add(key);
  }
  return names;
}

/**
 * Split and check a comma separated list of car classes.
 *
 *   "GTP, LMP2 , GT3" -> ["GTP", "LMP2", "GT3"]
 *
 * Matching ignores case, and the stored value is always the contract spelling.
 *
 * @param {unknown} value
 * @param {{ field?: string, min?: number, max?: number }} [options]
 * @returns {string[]}
 */
export function parseClassList(value, options = {}) {
  const field = options.field ?? 'classes';
  const min = options.min ?? 1;
  const max = options.max ?? 4;

  const raw = String(value ?? '')
    .split(',')
    .map((entry) => entry.trim().replace(/\s+/g, ' '))
    .filter((entry) => entry.length > 0);

  if (raw.length < min) reject(field, `needs at least ${min} class, separated by commas.`);
  if (raw.length > max) reject(field, `takes at most ${max} classes, found ${raw.length}.`);

  const classes = raw.map((entry) => {
    const match = CLASS_VALUES.find((allowed) => allowed.toLowerCase() === entry.toLowerCase());
    if (!match) {
      reject(field, `does not accept "${entry}".`, [`Allowed classes: ${CLASS_VALUES.join(', ')}`]);
    }
    return match;
  });

  const seen = new Set();
  for (const entry of classes) {
    if (seen.has(entry)) reject(field, `lists "${entry}" twice.`);
    seen.add(entry);
  }
  return classes;
}

/**
 * Normalise and check a date option.
 *
 * Slashes and dots are accepted as separators and rewritten to hyphens, so
 * "2026/09/06" and "2026.09.06" both become "2026-09-06". Everything else must
 * already be an ISO calendar date.
 *
 * @param {unknown} value
 * @param {{ field?: string, maxFuture?: boolean, now?: Date }} [options]
 *        maxFuture true applies the results rule: at most one day ahead
 * @returns {string} ISO date
 */
export function parseDate(value, options = {}) {
  const field = options.field ?? 'date';
  const raw = String(value ?? '').trim().replace(/[./]/g, '-');

  if (!DATE_PATTERN.test(raw)) {
    reject(field, 'must be written as YYYY-MM-DD, for example 2026-09-06.');
  }
  if (!isIsoDate(raw)) {
    reject(field, `is not a real date: "${raw}".`);
  }
  if (options.maxFuture) {
    const limit = maxResultDate(options.now);
    if (raw > limit) {
      reject(field, `must not be more than one day in the future. The latest allowed date is ${limit}.`);
    }
  }
  return raw;
}

/**
 * Check that an end date is not earlier than a start date.
 * @param {string} start ISO date
 * @param {string} end ISO date
 * @returns {string} the end date
 */
export function checkDateRange(start, end) {
  if (end < start) {
    reject('end', `must not be earlier than start (start is ${start}, end is ${end}).`);
  }
  return end;
}

/**
 * Check a finishing position.
 * @param {unknown} value
 * @returns {number}
 */
export function parsePosition(value) {
  const position = Number(value);
  if (!Number.isInteger(position) || position < 1 || position > 99) {
    reject('position', 'must be a whole number between 1 and 99.');
  }
  return position;
}

/**
 * Check the size of the field a result was scored in.
 *
 * The website renders position and entries together, as "P4 / 41", so a
 * position larger than the field size is refused here even though the contract
 * sets no relation between the two. Files edited by hand are not rejected for
 * it; only new input typed into a command is.
 *
 * @param {unknown} value
 * @param {number} [position] the finishing position, when it is known
 * @returns {number}
 */
export function parseEntries(value, position) {
  const entries = Number(value);
  if (!Number.isInteger(entries) || entries < ENTRIES_MIN || entries > ENTRIES_MAX) {
    reject('entries', `must be a whole number between ${ENTRIES_MIN} and ${ENTRIES_MAX}.`);
  }
  if (Number.isInteger(position) && position > entries) {
    reject('entries', `cannot be smaller than the finishing position, which is ${position}.`);
  }
  return entries;
}

/**
 * Check a driver number. An empty value is allowed and means "no number".
 * @param {unknown} value
 * @returns {string}
 */
export function parseDriverNumber(value) {
  const raw = String(value ?? '').trim();
  if (raw.length === 0) return '';
  const stripped = raw.replace(/^#/, '').replace(/^0+(?=\d)/, '');
  if (!NUMBER_PATTERN.test(stripped)) {
    reject('number', 'must be 1 to 3 digits, for example 14.');
  }
  return stripped;
}

/**
 * Check a country code and store it uppercase.
 * @param {unknown} value
 * @returns {string}
 */
export function parseCountry(value) {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!COUNTRY_PATTERN.test(raw)) {
    reject('country', 'must be a three letter country code, for example USA, GBR or NLD.');
  }
  return raw;
}

/**
 * Check an iRating value.
 * @param {unknown} value
 * @returns {number}
 */
export function parseIrating(value) {
  const irating = Number(value);
  if (!Number.isInteger(irating) || irating < 0 || irating > 15000) {
    reject('irating', 'must be a whole number between 0 and 15000.');
  }
  return irating;
}

/**
 * Check a licence string and store it in the contract spelling, such as "A 4.20".
 * @param {unknown} value
 * @returns {string}
 */
export function parseLicence(value) {
  const raw = String(value ?? '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!LICENCE_PATTERN.test(raw)) {
    reject('licence', 'must look like "A 4.20": a class letter A to D, R or P, a space, then the rating.');
  }
  return raw;
}

/**
 * Check a social link. An empty value clears the link.
 * @param {unknown} value
 * @param {string} field for example "twitch"
 * @returns {string}
 */
export function parseSocialUrl(value, field) {
  const raw = String(value ?? '').trim();
  if (raw.length === 0) return '';
  if (!/^https:\/\/\S+$/.test(raw)) {
    reject(field, 'must be a full https link, for example https://twitch.tv/name.');
  }
  return raw;
}

/**
 * Check a free text option that has a maximum length.
 * @param {unknown} value
 * @param {string} field
 * @param {number} max
 * @returns {string}
 */
export function parseText(value, field, max) {
  const raw = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (raw.length > max) {
    reject(field, `must be at most ${max} characters, found ${raw.length}.`);
  }
  return raw;
}

/**
 * Check a required free text option with a length range.
 * @param {unknown} value
 * @param {string} field
 * @param {number} min
 * @param {number} max
 * @returns {string}
 */
export function parseRequiredText(value, field, min, max) {
  const raw = parseText(value, field, max);
  if (raw.length < min) {
    reject(field, `must be at least ${min} characters.`);
  }
  return raw;
}

/**
 * Check a page number for the list commands.
 * @param {unknown} value
 * @returns {number} 1 when nothing was supplied
 */
export function parsePage(value) {
  if (value === null || value === undefined) return 1;
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) reject('page', 'must be a whole number of 1 or more.');
  return page;
}
