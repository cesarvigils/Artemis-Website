/**
 * Tests for src/lib/serialize.js: the sort order of each file, the exact output
 * format, the contract key order, and the handling of unknown fields.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { orderKeys, parseFile, serialize, sortRecords } from '../src/lib/serialize.js';

test('results sort by date descending, then position ascending', () => {
  const records = [
    { id: 'b', date: '2026-01-24', position: 1 },
    { id: 'c', date: '2026-09-06', position: 9 },
    { id: 'a', date: '2026-09-06', position: 2 },
    { id: 'd', date: '2026-05-01', position: 3 },
  ];
  assert.deepEqual(
    sortRecords('results', records).map((record) => record.id),
    ['a', 'c', 'd', 'b'],
  );
});

test('results with the same date and position fall back to the id', () => {
  const records = [
    { id: 'zulu', date: '2026-09-06', position: 4 },
    { id: 'alpha', date: '2026-09-06', position: 4 },
  ];
  assert.deepEqual(
    sortRecords('results', records).map((record) => record.id),
    ['alpha', 'zulu'],
  );
});

test('drivers sort by group road, oval, crew, then by number', () => {
  const records = [
    { id: 'crew-b', name: 'Tomas Ek', group: 'crew', number: '' },
    { id: 'oval-1', name: 'Colt', group: 'oval', number: '58' },
    { id: 'road-2', name: 'Dane', group: 'road', number: '14' },
    { id: 'crew-a', name: 'Priya Raghunathan', group: 'crew', number: '' },
    { id: 'road-1', name: 'Mateo', group: 'road', number: '7' },
    { id: 'oval-2', name: 'Shay', group: 'oval', number: '62' },
  ];
  assert.deepEqual(
    sortRecords('drivers', records).map((record) => record.id),
    ['road-1', 'road-2', 'oval-1', 'oval-2', 'crew-a', 'crew-b'],
  );
});

test('driver numbers sort numerically, not as text', () => {
  const records = [
    { id: 'c', name: 'C', group: 'road', number: '100' },
    { id: 'a', name: 'A', group: 'road', number: '7' },
    { id: 'b', name: 'B', group: 'road', number: '14' },
  ];
  assert.deepEqual(
    sortRecords('drivers', records).map((record) => record.number),
    ['7', '14', '100'],
  );
});

test('crew are ordered by name, and a driver without a number sorts last', () => {
  const crew = [
    { id: 'z', name: 'Zoe', group: 'crew', number: '' },
    { id: 'a', name: 'Adam', group: 'crew', number: '' },
  ];
  assert.deepEqual(
    sortRecords('drivers', crew).map((record) => record.name),
    ['Adam', 'Zoe'],
  );

  const road = [
    { id: 'none', name: 'No number', group: 'road', number: '' },
    { id: 'has', name: 'Has number', group: 'road', number: '99' },
  ];
  assert.deepEqual(
    sortRecords('drivers', road).map((record) => record.id),
    ['has', 'none'],
  );
});

test('events sort by start ascending', () => {
  const records = [
    { id: 'c', start: '2026-10-08', name: 'CTC' },
    { id: 'a', start: '2026-09-25', name: 'Petit' },
    { id: 'b', start: '2026-10-02', name: 'FNL' },
  ];
  assert.deepEqual(
    sortRecords('events', records).map((record) => record.id),
    ['a', 'b', 'c'],
  );
});

test('sortRecords does not modify the array it was given', () => {
  const records = [
    { id: 'b', start: '2026-10-08' },
    { id: 'a', start: '2026-09-25' },
  ];
  const sorted = sortRecords('events', records);
  assert.equal(records[0].id, 'b');
  assert.notEqual(sorted, records);
});

test('sortRecords refuses an unknown record type', () => {
  assert.throws(() => sortRecords('teams', []), /Unknown record kind/);
});

test('keys are written in contract order, with unknown keys kept at the end', () => {
  const record = {
    note: 'Kept',
    somethingCustom: 'also kept',
    position: 4,
    id: 'an-id-here',
    date: '2026-09-06',
    entries: 41,
  };
  assert.deepEqual(Object.keys(orderKeys('results', record)), [
    'id',
    'date',
    'position',
    'entries',
    'note',
    'somethingCustom',
  ]);
});

test('serialize produces two space indent, LF endings and a trailing newline', () => {
  const text = serialize('events', [
    { id: 'b-event-id', name: 'Second', start: '2026-10-02', classes: ['GT3'], status: 'planned' },
    { id: 'a-event-id', name: 'First', start: '2026-09-25', classes: ['GTP'], status: 'confirmed' },
  ]);

  assert.equal(text.endsWith('\n'), true);
  assert.equal(text.endsWith('\n\n'), false);
  assert.equal(text.includes('\r'), false);
  assert.equal(text.split('\n')[1], '  {');
  // Sorted on the way out: the September event comes first.
  assert.equal(JSON.parse(text)[0].id, 'a-event-id');
  assert.equal(text, `${JSON.stringify(JSON.parse(text), null, 2)}\n`);
});

test('serialize keeps an unknown field a human added by hand', () => {
  const text = serialize('drivers', [
    { id: 'someone', name: 'Someone', group: 'crew', number: '', helmetColour: 'teal' },
  ]);
  assert.equal(JSON.parse(text)[0].helmetColour, 'teal');
});

test('serialize writes an empty file as an empty array', () => {
  assert.equal(serialize('results', []), '[]\n');
});

test('no raw carriage return reaches the file, and the value is kept as it was', () => {
  const text = serialize('results', [{ id: 'an-id-here', note: 'one\r\ntwo' }]);
  // The file itself stays pure LF: the carriage return is escaped, not written.
  assert.equal(text.includes('\r'), false);
  assert.equal(text.includes(String.raw`\r`), true);
  // The value a human put there is preserved exactly.
  assert.equal(JSON.parse(text)[0].note, 'one\r\ntwo');
});

test('parseFile reports unusable content clearly', () => {
  assert.deepEqual(parseFile('[]', 'results.json'), []);
  assert.throws(() => parseFile('{ not json', 'results.json'), /results\.json is not valid JSON/);
  assert.throws(() => parseFile('{"id":"x"}', 'results.json'), /must contain a JSON array/);
});

test('serialising the sample data again changes nothing', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const kind of ['results', 'drivers', 'events']) {
    const text = await readFile(new URL(`../sample-data/${kind}.json`, import.meta.url), 'utf8');
    assert.equal(serialize(kind, JSON.parse(text)), text, `sample-data/${kind}.json is not in writer format`);
  }
});
