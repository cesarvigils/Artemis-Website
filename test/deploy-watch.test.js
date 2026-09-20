/**
 * Tests for src/lib/deploy-watch.js.
 *
 * The verdict logic is what matters here: GitHub reports build results through
 * two different APIs and the bot has to read both, because Vercel posts commit
 * statuses while GitHub Actions posts check runs. Reading only one of them
 * would mean reporting "passed" for a commit nothing has checked yet.
 *
 * The polling loop itself is only tested where it returns without polling.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readCommitVerdict, resetWatch, watchCommit, watchState } from '../src/lib/deploy-watch.js';

/**
 * A stand in for the GitHub backend, answering the two endpoints the watcher
 * calls.
 * @param {{ checks?: object[], statuses?: object[], status?: number }} [options]
 */
function fakeStorage(options = {}) {
  return {
    mode: 'github',
    target: { owner: 'cesarvigils', repo: 'Artemis-Website', branch: 'master', dataDir: 'src/data' },
    toError: (status, body, what) => new Error(`HTTP ${status} while trying to ${what}`),
    async request(path) {
      const status = options.status ?? 200;
      if (path.endsWith('/status')) {
        return { status, body: { statuses: options.statuses ?? [] }, headers: new Headers() };
      }
      return { status, body: { check_runs: options.checks ?? [] }, headers: new Headers() };
    },
  };
}

test('a passing check run and a passing status are a success', async () => {
  const storage = fakeStorage({
    checks: [{ name: 'test', status: 'completed', conclusion: 'success' }],
    statuses: [{ context: 'vercel', state: 'success' }],
  });
  const verdict = await readCommitVerdict(storage, 'abc1234567');
  assert.equal(verdict.verdict, 'success');
  assert.equal(verdict.total, 2);
});

test('a failing check run is a failure, and names the check', async () => {
  const storage = fakeStorage({
    checks: [
      { name: 'test', status: 'completed', conclusion: 'success' },
      { name: 'check:data', status: 'completed', conclusion: 'failure' },
    ],
  });
  const verdict = await readCommitVerdict(storage, 'abc1234567');
  assert.equal(verdict.verdict, 'failure');
  assert.deepEqual(verdict.failed, ['check:data']);
});

test('a failing Vercel commit status is a failure, which check runs alone would miss', async () => {
  const storage = fakeStorage({
    checks: [],
    statuses: [{ context: 'vercel - artemis-website', state: 'failure' }],
  });
  const verdict = await readCommitVerdict(storage, 'abc1234567');
  assert.equal(verdict.verdict, 'failure');
  assert.deepEqual(verdict.failed, ['vercel - artemis-website']);
});

test('anything still running is pending, even next to a passing check', async () => {
  const storage = fakeStorage({
    checks: [
      { name: 'test', status: 'completed', conclusion: 'success' },
      { name: 'build', status: 'in_progress', conclusion: null },
    ],
  });
  assert.equal((await readCommitVerdict(storage, 'abc')).verdict, 'pending');
});

test('a pending status is pending too', async () => {
  const storage = fakeStorage({ statuses: [{ context: 'vercel', state: 'pending' }] });
  assert.equal((await readCommitVerdict(storage, 'abc')).verdict, 'pending');
});

test('neutral and skipped conclusions are not failures', async () => {
  const storage = fakeStorage({
    checks: [
      { name: 'lint', status: 'completed', conclusion: 'neutral' },
      { name: 'optional', status: 'completed', conclusion: 'skipped' },
    ],
  });
  assert.equal((await readCommitVerdict(storage, 'abc')).verdict, 'success');
});

test('a commit nothing checks reports none, not success', async () => {
  // Reporting success here would claim the site is live on the strength of no
  // evidence at all.
  const verdict = await readCommitVerdict(fakeStorage(), 'abc');
  assert.equal(verdict.verdict, 'none');
  assert.equal(verdict.total, 0);
});

test('a token that cannot read checks is reported as unavailable, not as an error', async () => {
  const storage = fakeStorage({ status: 403 });
  await assert.rejects(() => readCommitVerdict(storage, 'abc'), (error) => error.unavailable === true);
});

test('any other GitHub error is passed through the backend error mapping', async () => {
  const storage = fakeStorage({ status: 500 });
  await assert.rejects(() => readCommitVerdict(storage, 'abc'), /HTTP 500/);
});

test('local storage mode is skipped without any request', async () => {
  resetWatch();
  const result = await watchCommit(
    { storage: { mode: 'local' }, config: { deployWatch: true } },
    { sha: 'abc1234567' },
  );
  assert.equal(result.state, 'skipped');
});

test('DEPLOY_WATCH=off is skipped without any request', async () => {
  resetWatch();
  const result = await watchCommit({ storage: fakeStorage(), config: { deployWatch: false } }, { sha: 'abc' });
  assert.equal(result.state, 'skipped');
  assert.equal(watchState(), 'unknown');
});

test('a local write with no commit sha is skipped', async () => {
  resetWatch();
  const result = await watchCommit({ storage: fakeStorage(), config: { deployWatch: true } }, { sha: '' });
  assert.equal(result.state, 'skipped');
});
