/**
 * Tests for src/lib/slug.js and src/lib/ids.js: the slug rules, the default id
 * of each record type, and de-duplication with the -2, -3 suffix.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { slug, slugJoin } from '../src/lib/slug.js';
import { defaultId, idSet, indexOfId, isValidId, makeId, uniqueId } from '../src/lib/ids.js';
import { ID_PATTERN } from '../src/lib/schema.js';

test('slug lowercases, folds accents and joins with single hyphens', () => {
  assert.equal(slug('Suzuka 1000'), 'suzuka-1000');
  assert.equal(slug('NASCAR Trucks'), 'nascar-trucks');
  assert.equal(slug('Friday Night Lights, round 9'), 'friday-night-lights-round-9');
  assert.equal(slug('Ines Marchetti'), 'ines-marchetti');
  assert.equal(slug('  Petit   Le  Mans  '), 'petit-le-mans');
  assert.equal(slug('GT3 / Endurance'), 'gt3-endurance');
  assert.equal(slug('a--b'), 'a-b');
});

test('slug returns an empty string when there is nothing to use', () => {
  assert.equal(slug(''), '');
  assert.equal(slug('   ---   '), '');
  assert.equal(slug(null), '');
  assert.equal(slug(undefined), '');
});

test('slug never exceeds the id length and never ends with a hyphen', () => {
  const long = slug('a '.repeat(120));
  assert.equal(long.length <= 80, true);
  assert.equal(long.endsWith('-'), false);
});

test('slugJoin skips parts that have nothing usable', () => {
  assert.equal(slugJoin('2026-09-06', 'Suzuka 1000', 'GT3'), '2026-09-06-suzuka-1000-gt3');
  assert.equal(slugJoin('2026-09-06', '', 'GT3'), '2026-09-06-gt3');
  assert.equal(slugJoin('---', 'Name'), 'name');
});

test('default ids follow the contract for each record type', () => {
  assert.equal(
    defaultId('results', { date: '2026-09-06', event: 'Suzuka 1000', class: 'GT3' }),
    '2026-09-06-suzuka-1000-gt3',
  );
  assert.equal(defaultId('drivers', { name: 'Matthew Blackley' }), 'matthew-blackley');
  assert.equal(defaultId('events', { start: '2026-09-25', name: 'Petit Le Mans' }), '2026-09-25-petit-le-mans');
});

test('a very short name still produces a valid id', () => {
  // "Al" alone is two characters, which the contract does not allow.
  const id = defaultId('drivers', { name: 'Al' });
  assert.match(id, ID_PATTERN);
  assert.equal(id, 'al-driver');
});

test('a name with no usable characters falls back to the record type', () => {
  const id = defaultId('drivers', { name: '---' });
  assert.match(id, ID_PATTERN);
});

test('uniqueId appends -2, then -3, and leaves a free id alone', () => {
  assert.equal(uniqueId('petit-le-mans', []), 'petit-le-mans');
  assert.equal(uniqueId('petit-le-mans', ['petit-le-mans']), 'petit-le-mans-2');
  assert.equal(uniqueId('petit-le-mans', ['petit-le-mans', 'petit-le-mans-2']), 'petit-le-mans-3');
  assert.equal(uniqueId('petit-le-mans', new Set(['petit-le-mans'])), 'petit-le-mans-2');
});

test('de-duplication keeps the id within 80 characters', () => {
  const base = 'a'.repeat(80);
  const id = uniqueId(base, [base]);
  assert.equal(id.length <= 80, true);
  assert.match(id, ID_PATTERN);
  assert.equal(id.endsWith('-2'), true);
});

test('makeId uses an explicit id when one is supplied, slugging it first', () => {
  const record = { date: '2026-09-06', event: 'Suzuka 1000', class: 'GT3' };
  assert.equal(makeId('results', record, [], 'My Custom Id'), 'my-custom-id');
  assert.equal(makeId('results', record, ['my-custom-id'], 'My Custom Id'), 'my-custom-id-2');
  assert.equal(makeId('results', record, []), '2026-09-06-suzuka-1000-gt3');
});

test('makeId produces a valid id for every record type', () => {
  assert.match(makeId('results', { date: '2026-09-06', event: 'Suzuka 1000', class: 'GT3' }, []), ID_PATTERN);
  assert.match(makeId('drivers', { name: 'Colt Vandermeer' }, []), ID_PATTERN);
  assert.match(makeId('events', { start: '2026-10-08', name: 'CTC truck league, round 9' }, []), ID_PATTERN);
});

test('defaultId refuses an unknown record type', () => {
  assert.throws(() => defaultId('teams', {}), /Unknown record kind/);
});

test('idSet and indexOfId find records by id', () => {
  const records = [{ id: 'one' }, { id: 'two' }, { name: 'no id here' }];
  assert.deepEqual([...idSet(records)], ['one', 'two']);
  assert.equal(indexOfId(records, 'two'), 1);
  assert.equal(indexOfId(records, 'three'), -1);
});

test('isValidId matches the contract pattern', () => {
  assert.equal(isValidId('2026-09-06-suzuka-1000-gt3'), true);
  assert.equal(isValidId('ab'), false);
  assert.equal(isValidId('Has-Capitals'), false);
  assert.equal(isValidId('has_underscore'), false);
  assert.equal(isValidId('a'.repeat(81)), false);
  assert.equal(isValidId(42), false);
});
