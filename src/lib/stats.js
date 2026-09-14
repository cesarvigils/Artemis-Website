/**
 * stats.js
 *
 * stats.json (see docs/data-contract.md, version 1.2) is generated nightly by
 * a separate iRacing sync job. It is NOT one of the three files this bot
 * manages: the bot never validates it, never writes it, and /data validate
 * skips it entirely.
 *
 * The only thing the bot does with it is show a one-line summary in
 * /data status, read directly from the repository or local folder. Reading
 * and parsing here is defensive on purpose: a missing or malformed file from
 * a broken sync run must never break the status command.
 */

import { STATS_FILE } from './schema.js';

export { STATS_FILE };

/**
 * Pull the two values /data status shows out of the parsed file.
 * @param {string} text raw file content
 * @returns {{ updated: string, driverCount: number }}
 * @throws {Error} when the text is not valid JSON, or not a JSON object
 */
export function summarizeStats(text) {
  const parsed = JSON.parse(text);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('stats.json must contain a JSON object');
  }
  const updated = typeof parsed.updated === 'string' && parsed.updated.length > 0 ? parsed.updated : 'unknown';
  const driverCount =
    parsed.drivers && typeof parsed.drivers === 'object' && !Array.isArray(parsed.drivers)
      ? Object.keys(parsed.drivers).length
      : 0;
  return { updated, driverCount };
}

/**
 * Read and summarise stats.json through a storage backend. Tolerates a
 * missing file, a read failure and a malformed file: none of these throw, so
 * a broken or absent sync can never fail /data status.
 *
 * @param {{ readOptionalFile: (name: string) => Promise<{ text: string } | null> }} storage
 * @returns {Promise<{ found: boolean, ok: boolean, updated?: string, driverCount?: number, error?: string }>}
 *   found  - true once a file was actually read from storage, valid or not
 *   ok     - true when it was found and parsed into the expected shape
 */
export async function readStatsSummary(storage) {
  let file;
  try {
    file = await storage.readOptionalFile(STATS_FILE);
  } catch (error) {
    return { found: false, ok: false, error: error.message };
  }
  if (!file) return { found: false, ok: false };

  try {
    const { updated, driverCount } = summarizeStats(file.text);
    return { found: true, ok: true, updated, driverCount };
  } catch (error) {
    return { found: true, ok: false, error: error.message };
  }
}
