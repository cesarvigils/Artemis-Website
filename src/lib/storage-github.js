/**
 * storage-github.js
 *
 * The GitHub backend: reads and writes the three data files in the website
 * repository through the Contents API, using the built-in fetch. One command
 * produces one commit.
 *
 * Interface (identical to storage-local.js):
 *   readFile(kind)                      -> { text, sha }
 *   writeFile(kind, text, { sha, ... }) -> { sha, commitSha, shortSha, url }
 *   lastCommit()                        -> { sha, shortSha, date, message } | null
 *
 * The sha returned by readFile is the blob sha GitHub gave us. It must be sent
 * back with the write; if the file moved on in the meantime GitHub answers 409
 * or 422 and the caller retries once (see storage.js).
 *
 * Required settings: GITHUB_TOKEN (fine-grained, Contents read and write),
 * GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, DATA_DIR.
 */

import { FILES } from './schema.js';
import { BotError } from './errors.js';
import { log } from './log.js';

/** The commit author and committer for every write, per the data contract. */
export const COMMIT_IDENTITY = Object.freeze({
  name: 'Artemis Data Bot',
  email: 'bot@artemisesports.com',
});

/** How long one API call may take before it is abandoned. */
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Header GitHub sends back on every response authenticated with a fine-grained
 * personal access token, for example "2026-12-01 09:00:00 +0000". Classic
 * tokens and GitHub App installation tokens do not send it, so its absence
 * means "unknown", never "does not expire".
 */
const TOKEN_EXPIRY_HEADER = 'github-authentication-token-expiration';

/**
 * Create the GitHub storage backend.
 * @param {import('./config.js').BotConfig} config
 * @returns {object} storage backend
 */
export function createGithubStorage(config) {
  const owner = config.githubOwner;
  const repo = config.githubRepo;
  const branch = config.githubBranch;
  const apiBase = config.githubApiBase || 'https://api.github.com';
  // The Contents API always uses forward slashes, whatever the host platform is.
  const dataDir = config.dataDir.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

  /**
   * Path of one data file inside the repository.
   * @param {'results'|'drivers'|'events'} kind
   * @returns {string}
   */
  function repoPath(kind) {
    const name = FILES[kind];
    if (!name) throw new Error(`Unknown record kind: ${kind}`);
    return dataDir ? `${dataDir}/${name}` : name;
  }

  /**
   * Expiry of the fine-grained token, as last reported by GitHub. Null until
   * the first call, and null forever for a token type that does not say.
   * @type {string | null}
   */
  let tokenExpiry = null;

  /**
   * Call the GitHub API and parse the JSON body.
   * @param {string} url absolute URL
   * @param {RequestInit} [init]
   * @returns {Promise<{ status: number, body: any, headers: Headers }>}
   */
  async function call(url, init = {}) {
    let response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${config.githubToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'artemis-data-bot',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init.headers || {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error.name === 'TimeoutError' ? 'the request timed out' : error.message;
      throw new BotError(`Could not reach GitHub: ${reason}.`, {
        title: 'Network error',
        details: ['Check the host connection and try the command again.'],
        cause: error,
      });
    }

    const expiry = response.headers.get(TOKEN_EXPIRY_HEADER);
    if (expiry) tokenExpiry = expiry;

    const text = await response.text();
    let body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text.slice(0, 200) };
      }
    }
    return { status: response.status, body, headers: response.headers };
  }

  /**
   * Turn a failed response into a BotError an operator can act on.
   * @param {number} status
   * @param {any} body
   * @param {string} what for example "read results.json"
   * @returns {BotError}
   */
  function apiError(status, body, what) {
    const message = body?.message ? String(body.message) : `HTTP ${status}`;
    if (status === 401) {
      return new BotError(`GitHub rejected the token while trying to ${what}.`, {
        title: 'GitHub authentication failed',
        details: [
          'GITHUB_TOKEN is missing, expired or mistyped.',
          'Create a new fine-grained token with Contents read and write, then restart the bot.',
        ],
      });
    }
    if (status === 403) {
      const rateLimited = /rate limit/i.test(message);
      return new BotError(`GitHub refused the request while trying to ${what}: ${message}`, {
        title: rateLimited ? 'GitHub rate limit reached' : 'GitHub permission denied',
        details: rateLimited
          ? ['Wait for the limit window to reset and try again.']
          : [
              `Give the token access to ${owner}/${repo} with Contents set to Read and write.`,
              'A fine-grained token also needs the repository selected in its resource list.',
            ],
      });
    }
    if (status === 404) {
      return new BotError(`GitHub could not find what it needed to ${what}.`, {
        title: 'Not found on GitHub',
        details: [
          `Checked ${owner}/${repo} on branch ${branch}, folder ${dataDir || '(repository root)'}.`,
          'A fine-grained token without access to the repository also reports 404.',
        ],
      });
    }
    if (status === 409 || status === 422) {
      const conflict = new BotError(`GitHub reported a conflict while trying to ${what}: ${message}`, {
        title: 'Write conflict',
      });
      conflict.conflict = true;
      return conflict;
    }
    return new BotError(`GitHub returned an error while trying to ${what}: ${message}`, {
      title: `GitHub error ${status}`,
    });
  }

  return {
    mode: 'github',

    /** @returns {string} one line for status embeds and log lines */
    describe() {
      return `${owner}/${repo} on branch ${branch}, folder ${dataDir || '(repository root)'}`;
    },

    /** Where this backend points, for the health probes and the deploy watcher. */
    target: Object.freeze({ owner, repo, branch, dataDir }),

    /**
     * Call any GitHub endpoint with the same headers, timeout and error
     * handling as the read and write paths. The health probes and the deploy
     * watcher use this rather than a second fetch wrapper of their own.
     *
     * @param {string} path repository-relative or absolute API path, for
     *   example "/repos/o/r/commits/sha/check-runs" or "/rate_limit"
     * @param {RequestInit} [init]
     * @returns {Promise<{ status: number, body: any, headers: Headers }>}
     */
    async request(path, init = {}) {
      const url = path.startsWith('http') ? path : `${apiBase}${path}`;
      return call(url, { method: 'GET', ...init });
    },

    /**
     * Turn a failed response from request() into a BotError.
     * @param {number} status
     * @param {any} body
     * @param {string} what
     * @returns {BotError}
     */
    toError(status, body, what) {
      return apiError(status, body, what);
    },

    /**
     * Expiry of the fine-grained token as GitHub last reported it, or null
     * when no call has been made yet or the token type does not say.
     * @returns {string | null}
     */
    tokenExpiry() {
      return tokenExpiry;
    },

    /**
     * Read one data file from the branch.
     * @param {'results'|'drivers'|'events'} kind
     * @returns {Promise<{ text: string, sha: string }>}
     */
    async readFile(kind) {
      const file = repoPath(kind);
      const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURI(file)}?ref=${encodeURIComponent(branch)}`;
      const { status, body } = await call(url, { method: 'GET' });
      if (status !== 200) throw apiError(status, body, `read ${file}`);
      if (body?.type !== 'file' || typeof body.content !== 'string') {
        if (body?.encoding === 'none') {
          throw new BotError(`${file} is too large for the Contents API (over 1 MB).`, {
            title: 'File too large',
          });
        }
        throw new BotError(`${file} is not a regular file in the repository.`, { title: 'Unexpected content' });
      }
      const text = Buffer.from(body.content.replace(/\s/g, ''), 'base64').toString('utf8');
      return { text, sha: String(body.sha) };
    },

    /**
     * Write one data file as a single commit.
     * @param {'results'|'drivers'|'events'} kind
     * @param {string} text the full new file content
     * @param {{ sha?: string | null, message: string }} options
     * @returns {Promise<{ sha: string, commitSha: string, shortSha: string, url: string | null }>}
     */
    async writeFile(kind, text, options) {
      const file = repoPath(kind);
      const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURI(file)}`;
      const payload = {
        message: options.message,
        content: Buffer.from(text, 'utf8').toString('base64'),
        branch,
        committer: { ...COMMIT_IDENTITY },
        author: { ...COMMIT_IDENTITY },
      };
      if (options.sha) payload.sha = options.sha;

      const { status, body } = await call(url, { method: 'PUT', body: JSON.stringify(payload) });
      if (status !== 200 && status !== 201) throw apiError(status, body, `write ${file}`);

      const commitSha = String(body?.commit?.sha ?? '');
      log.debug('GitHub write accepted', { file, commit: commitSha.slice(0, 7) });
      return {
        sha: String(body?.content?.sha ?? ''),
        commitSha,
        shortSha: commitSha.slice(0, 7),
        url: body?.commit?.html_url ?? null,
      };
    },

    /**
     * Most recent commit that touched the data folder on the branch.
     * @returns {Promise<{ sha: string, shortSha: string, date: string, message: string } | null>}
     */
    async lastCommit() {
      const query = new URLSearchParams({ sha: branch, per_page: '1' });
      if (dataDir) query.set('path', dataDir);
      const url = `${apiBase}/repos/${owner}/${repo}/commits?${query.toString()}`;
      const { status, body } = await call(url, { method: 'GET' });
      if (status !== 200) throw apiError(status, body, 'read the commit history');
      const commit = Array.isArray(body) ? body[0] : null;
      if (!commit) return null;
      const sha = String(commit.sha ?? '');
      return {
        sha,
        shortSha: sha.slice(0, 7),
        date: String(commit.commit?.committer?.date ?? commit.commit?.author?.date ?? ''),
        message: String(commit.commit?.message ?? '').split('\n')[0],
      };
    },

    /**
     * Read a file that is not one of the three managed data files, such as
     * stats.json (see schema.js STATS_FILE). Unlike readFile this never
     * throws for a missing file: it returns null, because the bot does not
     * own this file and must tolerate it never having been generated yet.
     * @param {string} name file name inside dataDir
     * @returns {Promise<{ text: string } | null>}
     */
    async readOptionalFile(name) {
      const file = dataDir ? `${dataDir}/${name}` : name;
      const url = `${apiBase}/repos/${owner}/${repo}/contents/${encodeURI(file)}?ref=${encodeURIComponent(branch)}`;
      const { status, body } = await call(url, { method: 'GET' });
      if (status === 404) return null;
      if (status !== 200) throw apiError(status, body, `read ${file}`);
      if (body?.type !== 'file' || typeof body.content !== 'string') return null;
      const text = Buffer.from(body.content.replace(/\s/g, ''), 'base64').toString('utf8');
      return { text };
    },
  };
}

export default createGithubStorage;
