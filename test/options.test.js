/**
 * Tests for src/lib/options.js: the command option parsing, in particular the
 * comma separated driver and class lists and the date checks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDateRange,
  checkStartTimeDate,
  parseClassList,
  parseCountry,
  parseDate,
  parseDriverNumber,
  parseEntries,
  parseIracingId,
  parseIrating,
  parseLicence,
  parseNameList,
  parsePage,
  parsePosition,
  parseRequiredText,
  parseSocialUrl,
  parseStartTime,
  parseText,
  trimOption,
} from '../src/lib/options.js';
import { isClearToken } from '../src/lib/schema.js';
import { BotError } from '../src/lib/errors.js';

/** A fixed clock, so the date rules do not depend on the day the tests run. */
const now = new Date('2026-09-14T12:00:00Z');

test('trimOption returns undefined for anything empty', () => {
  assert.equal(trimOption('  hello  '), 'hello');
  assert.equal(trimOption('   '), undefined);
  assert.equal(trimOption(''), undefined);
  assert.equal(trimOption(null), undefined);
  assert.equal(trimOption(undefined), undefined);
});

test('a driver list is split on commas and trimmed', () => {
  assert.deepEqual(parseNameList('Matthew Blackley, Nolan Walker'), ['Matthew Blackley', 'Nolan Walker']);
  assert.deepEqual(parseNameList('  Solo Driver  '), ['Solo Driver']);
  assert.deepEqual(parseNameList('One,Two,Three'), ['One', 'Two', 'Three']);
});

test('empty entries in a driver list are dropped', () => {
  assert.deepEqual(parseNameList('Solo Driver,,  ,'), ['Solo Driver']);
  assert.deepEqual(parseNameList(',, A Driver ,,'), ['A Driver']);
});

test('runs of spaces inside a name are collapsed', () => {
  assert.deepEqual(parseNameList('Matthew   Blackley'), ['Matthew Blackley']);
});

test('a driver list keeps the order it was typed in', () => {
  assert.deepEqual(parseNameList('Zulu Driver, Alpha Driver'), ['Zulu Driver', 'Alpha Driver']);
});

test('a driver list refuses an empty list, too many names and bad lengths', () => {
  assert.throws(() => parseNameList(''), BotError);
  assert.throws(() => parseNameList('   '), /at least 1 name/);
  assert.throws(() => parseNameList('A, B, C, D, E, F, G'), /at most 6 name/);
  assert.throws(() => parseNameList('A'), /between 2 and 40 characters/);
  assert.throws(() => parseNameList(`${'x'.repeat(41)}`), /between 2 and 40 characters/);
});

test('a driver list refuses the same name twice', () => {
  assert.throws(() => parseNameList('Dane Kowalczyk, dane kowalczyk'), /twice/);
});

test('a class list is split, matched without case and kept in contract spelling', () => {
  assert.deepEqual(parseClassList('GTP, LMP2 , GT3'), ['GTP', 'LMP2', 'GT3']);
  assert.deepEqual(parseClassList('gt3'), ['GT3']);
  assert.deepEqual(parseClassList('nascar trucks'), ['NASCAR Trucks']);
});

test('a class list refuses unknown classes and lists what is allowed', () => {
  assert.throws(() => parseClassList('Trucks'), (error) => {
    assert.equal(error instanceof BotError, true);
    assert.match(error.message, /does not accept "Trucks"/);
    assert.match(error.details.join(' '), /NASCAR Trucks/);
    return true;
  });
  assert.throws(() => parseClassList(''), /at least 1 class/);
  assert.throws(() => parseClassList('GTP, LMP2, GT3, GT4, TCR'), /at most 4 classes/);
  assert.throws(() => parseClassList('GT3, GT3'), /twice/);
});

test('dates must be real calendar dates in ISO form', () => {
  assert.equal(parseDate('2026-09-06', { now }), '2026-09-06');
  assert.throws(() => parseDate('06-09-2026', { now }), /YYYY-MM-DD/);
  assert.throws(() => parseDate('2026-9-6', { now }), /YYYY-MM-DD/);
  assert.throws(() => parseDate('', { now }), /YYYY-MM-DD/);
  assert.throws(() => parseDate('2026-02-30', { now }), /not a real date/);
  assert.throws(() => parseDate('2026-13-01', { now }), /not a real date/);
});

test('slashes and dots in a date are rewritten to hyphens', () => {
  assert.equal(parseDate('2026/09/06', { now }), '2026-09-06');
  assert.equal(parseDate('2026.09.06', { now }), '2026-09-06');
  assert.equal(parseDate('  2026/09/06  ', { now }), '2026-09-06');
});

test('a result date may be at most one day in the future', () => {
  assert.equal(parseDate('2026-09-15', { now, maxFuture: true }), '2026-09-15');
  assert.throws(() => parseDate('2026-09-16', { now, maxFuture: true }), /more than one day in the future/);
  // An event date has no such limit.
  assert.equal(parseDate('2027-01-24', { now }), '2027-01-24');
});

test('an end date may equal the start but not precede it', () => {
  assert.equal(checkDateRange('2026-09-25', '2026-09-27'), '2026-09-27');
  assert.equal(checkDateRange('2026-09-25', '2026-09-25'), '2026-09-25');
  assert.throws(() => checkDateRange('2026-09-25', '2026-09-24'), /not be earlier than start/);
});

test('a finishing position must be a whole number from 1 to 99', () => {
  assert.equal(parsePosition(4), 4);
  assert.equal(parsePosition('4'), 4);
  assert.throws(() => parsePosition(0), /between 1 and 99/);
  assert.throws(() => parsePosition(100), /between 1 and 99/);
  assert.throws(() => parsePosition(1.5), /between 1 and 99/);
  assert.throws(() => parsePosition('fourth'), /between 1 and 99/);
});

test('entries must fit the contract range and hold the position', () => {
  assert.equal(parseEntries(41), 41);
  assert.equal(parseEntries(41, 4), 41);
  assert.equal(parseEntries(41, 41), 41);
  assert.throws(() => parseEntries(1), /between 2 and 999/);
  assert.throws(() => parseEntries(1000), /between 2 and 999/);
  assert.throws(() => parseEntries(20, 41), /cannot be smaller than the finishing position/);
});

test('a driver number accepts digits, a leading hash and leading zeros', () => {
  assert.equal(parseDriverNumber('14'), '14');
  assert.equal(parseDriverNumber('#14'), '14');
  assert.equal(parseDriverNumber('007'), '7');
  assert.equal(parseDriverNumber(''), '');
  assert.equal(parseDriverNumber('   '), '');
  assert.throws(() => parseDriverNumber('1234'), /1 to 3 digits/);
  assert.throws(() => parseDriverNumber('14A'), /1 to 3 digits/);
});

test('a country code is stored uppercase', () => {
  assert.equal(parseCountry('usa'), 'USA');
  assert.equal(parseCountry(' gbr '), 'GBR');
  assert.throws(() => parseCountry('US'), /three letter country code/);
  assert.throws(() => parseCountry('USAA'), /three letter country code/);
});

test('a licence is stored in the contract spelling', () => {
  assert.equal(parseLicence('a 4.20'), 'A 4.20');
  assert.equal(parseLicence('  R 1.50 '), 'R 1.50');
  assert.throws(() => parseLicence('A4.20'), /must look like/);
  assert.throws(() => parseLicence('Z 4.20'), /must look like/);
  assert.throws(() => parseLicence('A 4.2'), /must look like/);
});

test('iRating must be a whole number in range', () => {
  assert.equal(parseIrating(5012), 5012);
  assert.equal(parseIrating(0), 0);
  assert.throws(() => parseIrating(-1), /between 0 and 15000/);
  assert.throws(() => parseIrating(15001), /between 0 and 15000/);
});

test('an iRacing id must be a whole number between 1 and 99999999', () => {
  assert.equal(parseIracingId(745213), 745213);
  assert.equal(parseIracingId(1), 1);
  assert.equal(parseIracingId(99999999), 99999999);
  assert.throws(() => parseIracingId(0), /between 1 and 99999999/);
  assert.throws(() => parseIracingId(100000000), /between 1 and 99999999/);
  assert.throws(() => parseIracingId(1.5), /between 1 and 99999999/);
  assert.throws(() => parseIracingId('nope'), /between 1 and 99999999/);
});

test('checkStartTimeDate accepts a matching date and refuses a mismatch', () => {
  assert.equal(checkStartTimeDate('2026-09-25', '2026-09-25T14:00:00Z'), '2026-09-25T14:00:00Z');
  assert.throws(() => checkStartTimeDate('2026-09-25', '2026-09-26T14:00:00Z'), /start date, which is 2026-09-25/);
});

test('an event start time accepts HH:MM, treated as UTC on the start date', () => {
  assert.equal(parseStartTime('14:00', '2026-09-25'), '2026-09-25T14:00:00Z');
  assert.equal(parseStartTime('00:00', '2026-09-25'), '2026-09-25T00:00:00Z');
  assert.equal(parseStartTime(' 09:30 ', '2026-09-25'), '2026-09-25T09:30:00Z');
  assert.throws(() => parseStartTime('24:00', '2026-09-25'), /HH:MM, or a full ISO/);
  assert.throws(() => parseStartTime('9:30', '2026-09-25'), /HH:MM, or a full ISO/);
});

test('an event start time accepts a full ISO UTC timestamp on the start date', () => {
  assert.equal(parseStartTime('2026-09-25T14:00:00Z', '2026-09-25'), '2026-09-25T14:00:00Z');
  assert.throws(() => parseStartTime('2026-09-25T14:00:00', '2026-09-25'), /HH:MM, or a full ISO/);
  assert.throws(() => parseStartTime('2026-09-26T14:00:00Z', '2026-09-25'), /start date, which is 2026-09-25/);
  assert.throws(() => parseStartTime('not a time', '2026-09-25'), /HH:MM, or a full ISO/);
});

test('a social link must be https, and an empty value clears it', () => {
  assert.equal(parseSocialUrl('https://x.com/example', 'x'), 'https://x.com/example');
  assert.equal(parseSocialUrl('', 'x'), '');
  assert.throws(() => parseSocialUrl('http://x.com/example', 'x'), /full https link/);
  assert.throws(() => parseSocialUrl('x.com/example', 'x'), /full https link/);
});

test('free text is trimmed, collapsed and length checked', () => {
  assert.equal(parseText('  a   note  ', 'note', 140), 'a note');
  assert.equal(parseText('', 'note', 140), '');
  assert.throws(() => parseText('x'.repeat(141), 'note', 140), /at most 140 characters/);
  assert.equal(parseRequiredText('Suzuka 1000', 'event', 2, 80), 'Suzuka 1000');
  assert.throws(() => parseRequiredText('x', 'event', 2, 80), /at least 2 characters/);
});

test('a page number defaults to the first page', () => {
  assert.equal(parsePage(null), 1);
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage(3), 3);
  assert.throws(() => parsePage(0), /1 or more/);
  assert.throws(() => parsePage(-2), /1 or more/);
});

test('a single hyphen is the token that clears an optional field', () => {
  assert.equal(isClearToken('-'), true);
  assert.equal(isClearToken('  -  '), true);
  assert.equal(isClearToken('--'), false);
  assert.equal(isClearToken('a note'), false);
  assert.equal(isClearToken(''), false);
  assert.equal(isClearToken(null), false);
});

test('every refusal is a BotError with a title and no exclamation mark', () => {
  const calls = [
    () => parseNameList(''),
    () => parseClassList('Nope'),
    () => parseDate('nope'),
    () => parsePosition(0),
    () => parseEntries(1),
    () => parseCountry('x'),
    () => parseLicence('x'),
    () => parseIracingId(0),
    () => parseStartTime('nope', '2026-09-25'),
  ];
  for (const call of calls) {
    assert.throws(call, (error) => {
      assert.equal(error instanceof BotError, true);
      assert.equal(typeof error.title, 'string');
      assert.equal(error.title.length > 0, true);
      assert.equal(error.message.includes('!'), false);
      return true;
    });
  }
});
