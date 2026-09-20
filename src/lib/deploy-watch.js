/**
 * deploy-watch.js
 *
 * Follows the commit a command just made until the website's build has either
 * passed or failed, and says so when it fails.
 *
 * Without this the bot reports success at commit time and never looks again.
 * The website runs `npm run check:data` as a prebuild step, so a file that
 * breaks the data contract fails the build and the host keeps serving the
 * previous deployment - correct behaviour, but silent: the person who ran the
 * command has an embed saying the change is live.
 *
 * What it does:
 *   - polls the check runs and the commit statuses for the new commit
 *   - stays quiet while they are still running, and quiet when they pass
 *   - on failure, follows up in the same command reply and posts to the audit
 *     channel
 *
 * What it never does: throw into the command path, or keep the command waiting.
 * A write is reported the moment GitHub accepts it; this runs afterwards.
 *
 * Needs two more permissions on the fine-grained token than a write does:
 * Checks: Read and Commit statuses: Read. Without them the watcher reports
 * itself unavailable once and stops trying, and /health says so.
 */

import { log } from './log.js';

/** How often the commit is checked. */
const POLL_INTERVAL_MS = 15000;

/** How long to keep following one commit. Inside Discord's 15 minute token life. */
const POLL_LIMIT_MS = 5 * 60 * 1000;

/**
 * Whether the watcher can work at all this session.
 * 'unknown' until the first poll, then 'available' or 'unavailable'.
 * @type {'unknown'|'available'|'unavailable'}
 */
let state = 'unknown';

/**
 * The last commit followed to a conclusion, for /health.
 * @type {{ shortSha: string, state: 'success'|'failure'|'timeout', detail: string } | null}
 */
let last = null;

/** @returns {'unknown'|'available'|'unavailable'} */
export function watchState() {
  return state;
}

/** @returns {{ shortSha: string, state: string, detail: string } | null} */
export function lastWatch() {
  return last;
}

/** Forget what happened, so tests start from a clean slate. */
export function resetWatch() {
  state = 'unknown';
  last = null;
}

/**
 * Wait, without holding a timer that would keep the process alive.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer.unref === 'function') timer.unref();
  });
}

/**
 * Read every check run and commit status attached to one commit and reduce
 * them to a single verdict.
 *
 * GitHub has two mechanisms here and Vercel and GitHub Actions do not use the
 * same one, so both are read: check runs (the Checks API, used by Actions) and
 * commit statuses (the older API, used by Vercel).
 *
 * @param {object} storage the github backend
 * @param {string} sha
 * @returns {Promise<{ verdict: 'pending'|'success'|'failure'|'none', failed: string[], total: number }>}
 */
export async function readCommitVerdict(storage, sha) {
  const { owner, repo } = storage.target;
  const base = `/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}`;

  const [checks, statuses] = await Promise.all([
    storage.request(`${base}/check-runs?per_page=100`),
    storage.request(`${base}/status`),
  ]);

  for (const response of [checks, statuses]) {
    if (response.status === 403 || response.status === 404) {
      throw Object.assign(new Error('The token cannot read checks or commit statuses.'), {
        unavailable: true,
      });
    }
    if (response.status !== 200) {
      throw storage.toError(response.status, response.body, `read the checks for ${sha.slice(0, 7)}`);
    }
  }

  const runs = Array.isArray(checks.body?.check_runs) ? checks.body.check_runs : [];
  const contexts = Array.isArray(statuses.body?.statuses) ? statuses.body.statuses : [];

  const failed = [];
  let pending = false;

  for (const run of runs) {
    if (run.status !== 'completed') {
      pending = true;
      continue;
    }
    // neutral, skipped and success are all fine; the rest are not.
    if (!['success', 'neutral', 'skipped'].includes(String(run.conclusion))) {
      failed.push(String(run.name ?? 'check'));
    }
  }

  for (const context of contexts) {
    const contextState = String(context.state ?? '');
    if (contextState === 'pending') {
      pending = true;
      continue;
    }
    if (contextState !== 'success') failed.push(String(context.context ?? 'status'));
  }

  const total = runs.length + contexts.length;
  if (failed.length > 0) return { verdict: 'failure', failed, total };
  if (pending) return { verdict: 'pending', failed, total };
  if (total === 0) return { verdict: 'none', failed, total };
  return { verdict: 'success', failed, total };
}

/**
 * Follow one commit until its checks settle.
 *
 * Resolves with the outcome; never rejects. Callers do not await it: the
 * command has already replied by the time this starts.
 *
 * @param {{ storage: object, config: import('./config.js').BotConfig }} ctx
 * @param {{
 *   sha: string,
 *   shortSha?: string,
 *   url?: string | null,
 *   onFailure?: (report: { shortSha: string, failed: string[], url: string | null }) => Promise<void> | void
 * }} commit
 * @returns {Promise<{ state: 'success'|'failure'|'timeout'|'skipped'|'unavailable', detail: string }>}
 */
export async function watchCommit(ctx, commit) {
  const { storage, config } = ctx;

  if (storage.mode !== 'github') return { state: 'skipped', detail: 'local storage mode' };
  if (!config.deployWatch) return { state: 'skipped', detail: 'DEPLOY_WATCH=off' };
  if (state === 'unavailable') return { state: 'unavailable', detail: 'the token cannot read checks' };
  if (!commit.sha) return { state: 'skipped', detail: 'no commit sha' };

  const shortSha = commit.shortSha || commit.sha.slice(0, 7);
  const deadline = Date.now() + POLL_LIMIT_MS;

  try {
    // The checks do not exist the instant the commit lands, so wait once first.
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      const { verdict, failed, total } = await readCommitVerdict(storage, commit.sha);
      state = 'available';

      if (verdict === 'pending') continue;

      if (verdict === 'failure') {
        last = { shortSha, state: 'failure', detail: failed.join(', ') };
        log.warn('The build for a bot commit failed', { commit: shortSha, failed });
        if (commit.onFailure) {
          await commit.onFailure({ shortSha, failed, url: commit.url ?? null });
        }
        return { state: 'failure', detail: failed.join(', ') };
      }

      if (verdict === 'none') {
        // Nothing reports on this branch. Not a failure, and not worth asking
        // again every fifteen seconds for five minutes.
        last = { shortSha, state: 'success', detail: 'has no checks configured' };
        return { state: 'success', detail: 'no checks are configured for this branch' };
      }

      last = { shortSha, state: 'success', detail: `passed ${total} check(s)` };
      log.debug('The build for a bot commit passed', { commit: shortSha, checks: total });
      return { state: 'success', detail: `passed ${total} check(s)` };
    }

    last = { shortSha, state: 'timeout', detail: 'was still building after 5 minutes' };
    log.info('Stopped following a commit; its checks were still running', { commit: shortSha });
    return { state: 'timeout', detail: 'still running after 5 minutes' };
  } catch (error) {
    if (error?.unavailable) {
      state = 'unavailable';
      log.warn(
        'Cannot follow builds: the GitHub token needs Checks: Read and Commit statuses: Read. ' +
          'Builds will not be reported until it does.',
      );
      return { state: 'unavailable', detail: 'the token cannot read checks' };
    }
    // Anything else is this watcher's problem, not the operator's.
    log.warn('Could not follow a commit', error?.message ?? error);
    return { state: 'timeout', detail: String(error?.message ?? error) };
  }
}

export default watchCommit;
