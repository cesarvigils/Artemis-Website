/**
 * storage.js
 *
 * Chooses the backend (local or GitHub) and holds the read-modify-write cycle
 * that every change goes through, exactly as the data contract describes it:
 *
 *   1. read the file with its sha, parse it, validate the whole array
 *      (refuse the command when the file is already invalid, naming the record)
 *   2. apply the change, re-sort, serialise in the contract format
 *   3. write with the previous sha, using the bot commit identity and the
 *      contract commit message
 *   4. on a sha conflict, read again and retry once, then fail clearly
 *
 * Nothing is cached across commands: every command reads the file again, so a
 * hand edit made in GitHub is never overwritten silently. The one exception is
 * the short lived cache used to fill in autocomplete suggestions, which is read
 * only and never used to build a write.
 */

import { createLocalStorage } from './storage-local.js';
import { createGithubStorage } from './storage-github.js';
import { parseFile, serialize } from './serialize.js';
import { validateArray } from './validate.js';
import { BotError } from './errors.js';
import { FILES } from './schema.js';
import { log } from './log.js';

/** How long autocomplete may reuse a file it already read. */
export const AUTOCOMPLETE_TTL_MS = 30000;

/** How many problems of an already invalid file are shown before the list is cut. */
const MAX_REPORTED_ERRORS = 8;

/**
 * Build the storage backend named by the configuration.
 * @param {import('./config.js').BotConfig} config
 * @returns {object}
 */
export function createStorage(config) {
  return config.storage === 'local' ? createLocalStorage(config) : createGithubStorage(config);
}

/**
 * Commit message for one change, in the format the data contract fixes:
 *   data(results.json): add 2026-09-06-suzuka-1000-gt3 (by nina 123456789012345678)
 *
 * @param {'results'|'drivers'|'events'} kind
 * @param {'add'|'edit'|'remove'} action
 * @param {string} id
 * @param {{ username: string, id: string }} actor the Discord user who ran the command
 * @returns {string}
 */
export function commitMessage(kind, action, id, actor) {
  const username = String(actor?.username ?? 'unknown').replace(/\s+/g, ' ').trim() || 'unknown';
  const userId = String(actor?.id ?? '0');
  return `data(${FILES[kind]}): ${action} ${id} (by ${username} ${userId})`;
}

/**
 * Read one file and make sure its current content is valid.
 *
 * @param {object} storage
 * @param {'results'|'drivers'|'events'} kind
 * @param {{ validate?: boolean }} [options] validate defaults to true
 * @returns {Promise<{ records: Array<Record<string, any>>, sha: string, text: string, errors: string[] }>}
 */
export async function readRecords(storage, kind, options = {}) {
  const { text, sha } = await storage.readFile(kind);
  let records;
  try {
    records = parseFile(text, FILES[kind]);
  } catch (error) {
    throw new BotError(error.message, {
      title: 'Data file is unreadable',
      details: ['Fix the file in GitHub, then run the command again.'],
      cause: error,
    });
  }

  const { ok, errors } = validateArray(kind, records);
  if (options.validate !== false && !ok) {
    throw new BotError(`${FILES[kind]} does not match the data contract, so it was not changed.`, {
      title: 'Existing data is invalid',
      details: [
        ...errors.slice(0, MAX_REPORTED_ERRORS),
        ...(errors.length > MAX_REPORTED_ERRORS ? [`and ${errors.length - MAX_REPORTED_ERRORS} more problem(s)`] : []),
        'Run /data validate for the full list.',
      ],
    });
  }

  return { records, sha, text, errors };
}

/**
 * Read, change, validate, sort, serialise and write one file, retrying once
 * when the file moved on between the read and the write.
 *
 * The mutate function receives a fresh copy of the records and must return
 * { records, record, action, id }:
 *   records - the new array
 *   record  - the record that was added, edited or removed (for the reply embed)
 *   action  - "add", "edit" or "remove"
 *   id      - the id of that record
 * It may throw a BotError to refuse the change (for example, id not found).
 *
 * @param {object} storage
 * @param {'results'|'drivers'|'events'} kind
 * @param {(records: Array<Record<string, any>>) => { records: Array<Record<string, any>>, record: Record<string, any>, action: 'add'|'edit'|'remove', id: string }} mutate
 * @param {{ actor: { username: string, id: string } }} options
 * @returns {Promise<{ record: Record<string, any>, action: string, id: string, commit: { sha: string, shortSha: string, url: string | null }, total: number }>}
 */
export async function applyChange(storage, kind, mutate, options) {
  let attempt = 0;
  // Two passes at most: the first write, and one retry after a conflict.
  for (;;) {
    attempt += 1;
    const { records, sha } = await readRecords(storage, kind);
    const outcome = mutate(records.map((record) => structuredClone(record)));

    const check = validateArray(kind, outcome.records);
    if (!check.ok) {
      throw new BotError('The change would make the file invalid, so nothing was written.', {
        title: 'Change refused',
        details: check.errors.slice(0, MAX_REPORTED_ERRORS),
      });
    }

    const text = serialize(kind, outcome.records);
    const message = commitMessage(kind, outcome.action, outcome.id, options.actor);

    try {
      const written = await storage.writeFile(kind, text, { sha, message });
      log.info(`Wrote ${FILES[kind]}`, {
        action: outcome.action,
        id: outcome.id,
        commit: written.shortSha,
        attempt,
      });
      return {
        record: outcome.record,
        action: outcome.action,
        id: outcome.id,
        // Optional list of field names the mutate function touched, used in the reply.
        changed: outcome.changed ?? [],
        commit: { sha: written.commitSha, shortSha: written.shortSha, url: written.url },
        total: outcome.records.length,
      };
    } catch (error) {
      if (error?.conflict && attempt === 1) {
        log.warn(`Write conflict on ${FILES[kind]}, reading again and retrying once`);
        continue;
      }
      if (error?.conflict) {
        throw new BotError(`${FILES[kind]} is being changed by someone else, so nothing was written.`, {
          title: 'Write conflict',
          details: ['The file changed twice while this command ran. Wait a moment and try again.'],
          cause: error,
        });
      }
      throw error;
    }
  }
}

/**
 * Short lived cache for autocomplete only. Discord gives an autocomplete
 * handler three seconds, which is not enough for a round trip to GitHub on
 * every keystroke, so the parsed file is reused for up to 30 seconds.
 * Writes never read from here.
 */
const autocompleteCache = new Map();

/**
 * Records for autocomplete. Invalid records are returned as they are, so the
 * operator can still select and fix a broken record.
 *
 * @param {object} storage
 * @param {'results'|'drivers'|'events'} kind
 * @param {{ now?: number }} [options]
 * @returns {Promise<Array<Record<string, any>>>} empty when the file cannot be read
 */
export async function readForAutocomplete(storage, kind, options = {}) {
  const now = options.now ?? Date.now();
  const cached = autocompleteCache.get(kind);
  if (cached && now - cached.at < AUTOCOMPLETE_TTL_MS) return cached.records;

  try {
    const { text } = await storage.readFile(kind);
    const records = parseFile(text, FILES[kind]);
    autocompleteCache.set(kind, { at: now, records });
    return records;
  } catch (error) {
    log.warn(`Autocomplete could not read ${FILES[kind]}`, error.message);
    return cached?.records ?? [];
  }
}

/** Forget every cached file. Used by the tests and after a successful write. */
export function clearAutocompleteCache() {
  autocompleteCache.clear();
}
