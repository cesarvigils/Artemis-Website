/**
 * Tests for src/lib/storage-local.js and the read-modify-write cycle in
 * src/lib/storage.js: a full round trip, the commit message format, refusing to
 * write on top of an invalid file, and conflict handling.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLocalStorage } from '../src/lib/storage-local.js';
import { applyChange, commitMessage, readRecords } from '../src/lib/storage.js';
import { serialize } from '../src/lib/serialize.js';

const actor = { username: 'nina', id: '123456789012345678' };

/** A result that satisfies the contract. */
const sampleResult = (patch = {}) => ({
  id: '2026-09-06-suzuka-1000-gt3',
  date: '2026-09-06',
  event: 'Suzuka 1000',
  track: 'Suzuka International Racing Course',
  series: 'iRacing Special Event',
  class: 'GT3',
  position: 4,
  drivers: ['Matthew Blackley'],
  ...patch,
});

/**
 * Create a throwaway data directory holding the three files.
 * @param {{ results?: object[], drivers?: object[], events?: object[] }} [seed]
 * @returns {Promise<{ dir: string, storage: object, cleanup: () => Promise<void> }>}
 */
async function makeStorage(seed = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'artemis-bot-test-'));
  await mkdir(dir, { recursive: true });
  for (const kind of ['results', 'drivers', 'events']) {
    await writeFile(path.join(dir, `${kind}.json`), serialize(kind, seed[kind] ?? []), 'utf8');
  }
  return {
    dir,
    storage: createLocalStorage({ dataDir: dir }),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

test('commitMessage follows the contract format', () => {
  assert.equal(
    commitMessage('results', 'add', '2026-09-06-suzuka-1000-gt3', actor),
    'data(results.json): add 2026-09-06-suzuka-1000-gt3 (by nina 123456789012345678)',
  );
  assert.equal(
    commitMessage('drivers', 'remove', 'matthew-blackley', actor),
    'data(drivers.json): remove matthew-blackley (by nina 123456789012345678)',
  );
  // A missing user never produces a broken message.
  assert.match(commitMessage('events', 'edit', 'an-event', {}), /\(by unknown 0\)$/);
});

test('a record survives a write and a read unchanged', async (t) => {
  const { dir, storage, cleanup } = await makeStorage();
  t.after(cleanup);

  const record = sampleResult({ entries: 41, note: 'Two stops.' });
  const outcome = await applyChange(
    storage,
    'results',
    (records) => {
      records.push(record);
      return { records, record, action: 'add', id: record.id };
    },
    { actor },
  );

  assert.equal(outcome.action, 'add');
  assert.equal(outcome.total, 1);
  assert.equal(outcome.commit.shortSha.length, 7);

  const { records } = await readRecords(storage, 'results');
  assert.equal(records.length, 1);
  assert.deepEqual(records[0], record);

  // The file on disk is in the writer format, byte for byte.
  const text = await readFile(path.join(dir, 'results.json'), 'utf8');
  assert.equal(text, serialize('results', [record]));
});

test('a write sorts the file, whatever order the records arrive in', async (t) => {
  const { storage, cleanup } = await makeStorage({
    results: [sampleResult({ id: 'older-one-here', date: '2026-01-24' })],
  });
  t.after(cleanup);

  const newer = sampleResult({ id: 'newer-one-here', date: '2026-09-06' });
  await applyChange(
    storage,
    'results',
    (records) => {
      records.push(newer);
      return { records, record: newer, action: 'add', id: newer.id };
    },
    { actor },
  );

  const { records } = await readRecords(storage, 'results');
  assert.deepEqual(
    records.map((entry) => entry.id),
    ['newer-one-here', 'older-one-here'],
  );
});

test('an edit keeps an unknown field that a human added by hand', async (t) => {
  const { storage, cleanup } = await makeStorage({
    results: [sampleResult({ helmetColour: 'teal' })],
  });
  t.after(cleanup);

  await applyChange(
    storage,
    'results',
    (records) => {
      records[0].position = 2;
      return { records, record: records[0], action: 'edit', id: records[0].id };
    },
    { actor },
  );

  const { records } = await readRecords(storage, 'results');
  assert.equal(records[0].position, 2);
  assert.equal(records[0].helmetColour, 'teal');
});

test('a removal writes the file without the record', async (t) => {
  const { storage, cleanup } = await makeStorage({
    results: [sampleResult(), sampleResult({ id: 'second-result-id', position: 5 })],
  });
  t.after(cleanup);

  const outcome = await applyChange(
    storage,
    'results',
    (records) => {
      const [removed] = records.splice(0, 1);
      return { records, record: removed, action: 'remove', id: removed.id };
    },
    { actor },
  );

  assert.equal(outcome.total, 1);
  const { records } = await readRecords(storage, 'results');
  assert.deepEqual(
    records.map((entry) => entry.id),
    ['second-result-id'],
  );
});

test('nothing is written when the change would be invalid', async (t) => {
  const { dir, storage, cleanup } = await makeStorage({ results: [sampleResult()] });
  t.after(cleanup);

  const before = await readFile(path.join(dir, 'results.json'), 'utf8');
  await assert.rejects(
    applyChange(
      storage,
      'results',
      (records) => {
        records[0].position = 500;
        return { records, record: records[0], action: 'edit', id: records[0].id };
      },
      { actor },
    ),
    /would make the file invalid/,
  );
  assert.equal(await readFile(path.join(dir, 'results.json'), 'utf8'), before);
});

test('a file that is already invalid is reported and left alone', async (t) => {
  const { dir, storage, cleanup } = await makeStorage();
  t.after(cleanup);

  // A hand edit that does not match the contract: no id, position out of range.
  await writeFile(path.join(dir, 'results.json'), '[{"date":"2026-09-06","position":0}]\n', 'utf8');

  await assert.rejects(readRecords(storage, 'results'), (error) => {
    assert.match(error.message, /does not match the data contract/);
    assert.equal(error.details.some((detail) => detail.includes('results.json[0]')), true);
    return true;
  });
});

test('unreadable JSON is reported as such', async (t) => {
  const { dir, storage, cleanup } = await makeStorage();
  t.after(cleanup);
  await writeFile(path.join(dir, 'events.json'), '{ not json at all', 'utf8');
  await assert.rejects(readRecords(storage, 'events'), /is not valid JSON/);
});

test('a missing file names the folder to check', async (t) => {
  const { dir, storage, cleanup } = await makeStorage();
  t.after(cleanup);
  await rm(path.join(dir, 'drivers.json'));
  await assert.rejects(readRecords(storage, 'drivers'), /drivers\.json was not found/);
});

test('a write is refused when the file changed after it was read', async (t) => {
  const { dir, storage, cleanup } = await makeStorage({ results: [sampleResult()] });
  t.after(cleanup);

  const { sha } = await storage.readFile('results');
  await writeFile(path.join(dir, 'results.json'), serialize('results', []), 'utf8');

  await assert.rejects(
    storage.writeFile('results', serialize('results', [sampleResult()]), { sha, message: 'test' }),
    (error) => {
      assert.equal(error.conflict, true);
      return true;
    },
  );
});

test('a conflict is retried once and then succeeds', async (t) => {
  const { storage, cleanup } = await makeStorage({ results: [sampleResult()] });
  t.after(cleanup);

  // Fail the first write with a conflict, then behave normally.
  const realWrite = storage.writeFile.bind(storage);
  let attempts = 0;
  storage.writeFile = async (kind, text, options) => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('simulated conflict');
      error.conflict = true;
      throw error;
    }
    return realWrite(kind, text, options);
  };

  const outcome = await applyChange(
    storage,
    'results',
    (records) => {
      records[0].position = 3;
      return { records, record: records[0], action: 'edit', id: records[0].id };
    },
    { actor },
  );

  assert.equal(attempts, 2);
  assert.equal(outcome.record.position, 3);
});

test('two conflicts in a row give up with a clear message', async (t) => {
  const { storage, cleanup } = await makeStorage({ results: [sampleResult()] });
  t.after(cleanup);

  storage.writeFile = async () => {
    const error = new Error('simulated conflict');
    error.conflict = true;
    throw error;
  };

  await assert.rejects(
    applyChange(
      storage,
      'results',
      (records) => {
        records[0].position = 3;
        return { records, record: records[0], action: 'edit', id: records[0].id };
      },
      { actor },
    ),
    /is being changed by someone else/,
  );
});

test('the local backend describes itself without leaking anything', async (t) => {
  const { dir, storage, cleanup } = await makeStorage();
  t.after(cleanup);
  assert.equal(storage.mode, 'local');
  assert.match(storage.describe(), /local files in/);
  assert.equal(storage.describe().includes(path.basename(dir)), true);
  assert.equal(await storage.lastCommit(), null);
});

test('readOptionalFile returns null for a file that is not there, such as stats.json', async (t) => {
  const { storage, cleanup } = await makeStorage();
  t.after(cleanup);
  assert.equal(await storage.readOptionalFile('stats.json'), null);
});

test('readOptionalFile returns the text of a file that is present', async (t) => {
  const { dir, storage, cleanup } = await makeStorage();
  t.after(cleanup);
  await writeFile(path.join(dir, 'stats.json'), '{"updated":"2026-09-14T09:00:12Z"}', 'utf8');
  assert.deepEqual(await storage.readOptionalFile('stats.json'), {
    text: '{"updated":"2026-09-14T09:00:12Z"}',
  });
});
