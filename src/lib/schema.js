/**
 * schema.js
 *
 * Single source of truth for the shapes described in the Artemis data contract
 * (version 1.2, 14 Sep 2026). Enumerated values, file names and key order all live
 * here so that validation, serialisation, the slash command builders and the
 * documentation can never drift apart.
 *
 * Nothing in this file talks to Discord, GitHub or the file system.
 */

/** The three data files the bot owns, keyed by the name used in commands. */
export const KINDS = /** @type {const} */ (['results', 'drivers', 'events']);

/** Map of kind -> file name inside DATA_DIR. */
export const FILES = Object.freeze({
  results: 'results.json',
  drivers: 'drivers.json',
  events: 'events.json',
});

/** Map of kind -> singular noun, used in embed titles and commit messages. */
export const SINGULAR = Object.freeze({
  results: 'result',
  drivers: 'driver',
  events: 'event',
});

/**
 * Car classes. Used by results.class (one value) and events.classes (1-4 values).
 * Discord allows at most 25 choices per option, so these fit as literal choices.
 */
export const CLASS_VALUES = Object.freeze([
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
]);

/** drivers.role */
export const ROLE_VALUES = Object.freeze(['driver', 'pitwall', 'staff']);

/** drivers.group. "crew" is used for pitwall and staff members. */
export const GROUP_VALUES = Object.freeze(['road', 'oval', 'crew']);

/** Display order of driver groups in the sorted file. */
export const GROUP_ORDER = Object.freeze(['road', 'oval', 'crew']);

/** events.status */
export const STATUS_VALUES = Object.freeze(['planned', 'confirmed', 'done', 'skipped']);

/** Recognised keys of drivers.socials, in the order they are written. */
export const SOCIAL_KEYS = Object.freeze(['x', 'twitch', 'youtube', 'instagram']);

/** id: lowercase slug, 3-80 characters. */
export const ID_PATTERN = /^[a-z0-9-]{3,80}$/;

/** Dates are plain ISO calendar dates, no times. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** drivers.stats.licence, for example "A 4.20". */
export const LICENCE_PATTERN = /^[A-DRP] \d\.\d{2}$/;

/** drivers.country: ISO 3166-1 alpha-3, uppercase. */
export const COUNTRY_PATTERN = /^[A-Z]{3}$/;

/** drivers.number: 1-3 digits, or empty for crew. */
export const NUMBER_PATTERN = /^\d{1,3}$/;

/**
 * events.startTime: a full ISO 8601 UTC timestamp, for example
 * "2026-09-25T14:00:00Z". The date part must equal the event's `start`, which
 * is checked separately because it needs the record, not just the string.
 */
export const START_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\dZ$/;

/**
 * Key order used when a record is written back to disk. Known keys are written
 * first in this order; any unknown key a human added by hand is preserved and
 * appended afterwards in its original order (see serialize.js).
 */
export const KEY_ORDER = Object.freeze({
  results: [
    'id',
    'date',
    'event',
    'track',
    'series',
    'class',
    'position',
    'entries',
    'drivers',
    'note',
    '_placeholder',
  ],
  drivers: [
    'id',
    'name',
    'role',
    'group',
    'number',
    'country',
    'focus',
    'bio',
    'stats',
    'socials',
    'active',
    'iracingId',
    '_placeholder',
  ],
  events: ['id', 'name', 'track', 'start', 'end', 'startTime', 'classes', 'status', 'note', '_placeholder'],
});

/** Maximum length of the free-text note on results and events. */
export const NOTE_MAX = 140;

/**
 * results.entries: how many cars were in the class or split, so the website can
 * render a finish as "P4 / 41". Optional, and never smaller than two.
 */
export const ENTRIES_MIN = 2;
export const ENTRIES_MAX = 999;

/** Maximum length of a driver bio. */
export const BIO_MAX = 140;

/**
 * drivers.iracingId: the driver's iRacing customer id. Optional; when present,
 * the nightly iRacing sync (see stats.json below) fills in stats.json for this
 * driver.
 */
export const IRACING_ID_MIN = 1;
export const IRACING_ID_MAX = 99999999;

/**
 * The generated file the nightly iRacing sync writes. Not one of the KINDS:
 * the bot never validates or writes it, and only /data status reads a summary
 * of it. See docs/data-contract.md, version 1.2.
 */
export const STATS_FILE = 'stats.json';

/**
 * Sentinel an operator types into an optional text option of an edit command to
 * clear the stored value (Discord has no "unset" for a string option).
 */
export const CLEAR_TOKEN = '-';

/**
 * True when the supplied option value means "clear this field".
 * @param {unknown} value
 * @returns {boolean}
 */
export function isClearToken(value) {
  return typeof value === 'string' && value.trim() === CLEAR_TOKEN;
}
