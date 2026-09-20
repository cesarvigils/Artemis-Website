/**
 * Tests for src/lib/health.js.
 *
 * The point of these probes is that they answer even when the thing they are
 * checking is broken, so most of what is tested here is failure: a storage
 * backend that throws, a channel the bot cannot post in, a token about to
 * expire. A probe that throws instead of reporting would take /health down
 * exactly when it is needed.
 *
 * The GitHub backend is faked. It only has to answer the handful of endpoints
 * the probes call.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits } from 'discord.js';
import {
  daysUntil,
  formatUptime,
  runProbes,
  summarize,
  TOKEN_EXPIRY_WARN_DAYS,
  worstState,
} from '../src/lib/health.js';
import { resetWatch } from '../src/lib/deploy-watch.js';

/** The three files, in the shape the storage backends return them. */
const FILE_TEXT = {
  results: JSON.stringify(
    [
      {
        id: '2026-09-06-suzuka-1000-gt3',
        date: '2026-09-06',
        event: 'Suzuka 1000',
        track: 'Suzuka International Racing Course',
        series: 'iRacing Special Event',
        class: 'GT3',
        position: 4,
        drivers: ['Matthew Blackley'],
      },
    ],
    null,
    2,
  ),
  drivers: JSON.stringify(
    [
      {
        id: 'matthew-blackley',
        name: 'Matthew Blackley',
        role: 'driver',
        group: 'road',
        number: '14',
        country: 'USA',
        focus: 'GT3 / Endurance',
        active: true,
      },
    ],
    null,
    2,
  ),
  events: JSON.stringify(
    [
      {
        id: '2026-09-25-petit-le-mans',
        name: 'Petit Le Mans',
        track: 'Michelin Raceway Road Atlanta',
        start: '2026-09-25',
        classes: ['GTP'],
        status: 'confirmed',
      },
    ],
    null,
    2,
  ),
};

/**
 * A stand in for the GitHub backend.
 * @param {{ expiry?: string | null, remaining?: number, fail?: boolean, files?: object }} [options]
 */
function fakeGithubStorage(options = {}) {
  return {
    mode: 'github',
    target: { owner: 'cesarvigils', repo: 'Artemis-Website', branch: 'master', dataDir: 'src/data' },
    describe: () => 'cesarvigils/Artemis-Website on branch master, folder src/data',
    tokenExpiry: () => options.expiry ?? null,
    toError: (status, body, what) => new Error(`HTTP ${status} while trying to ${what}`),
    async request(path) {
      if (options.fail) return { status: 401, body: { message: 'Bad credentials' }, headers: new Headers() };
      if (path === '/rate_limit') {
        return {
          status: 200,
          body: { resources: { core: { limit: 5000, remaining: options.remaining ?? 4900, reset: 1789000000 } } },
          headers: new Headers(),
        };
      }
      return { status: 200, body: { name: 'master' }, headers: new Headers() };
    },
    async readFile(kind) {
      const text = (options.files ?? FILE_TEXT)[kind];
      if (text === undefined) throw new Error(`${kind} is missing`);
      return { text, sha: 'abc123' };
    },
    async readOptionalFile() {
      return null;
    },
  };
}

/** The settings the probes read. */
const baseConfig = {
  storage: 'github',
  dataDir: 'src/data',
  githubOwner: 'cesarvigils',
  githubRepo: 'Artemis-Website',
  githubBranch: 'master',
  logChannelId: '',
  resultsChannelId: '',
  deployWatch: true,
};

/**
 * @param {Array<{ name: string, state: string, detail: string }>} probes
 * @param {string} name
 */
const find = (probes, name) => probes.find((probe) => probe.name === name);

test('formatUptime reads as a person would say it', () => {
  assert.equal(formatUptime(45), '0m 45s');
  assert.equal(formatUptime(3700), '1h 1m');
  assert.equal(formatUptime(280000), '3d 5h 46m');
});

test('daysUntil counts whole days, and goes negative once the date has passed', () => {
  const now = new Date('2026-09-20T12:00:00Z');
  assert.equal(daysUntil('2026-09-30T12:00:00Z', now), 10);
  assert.equal(daysUntil('2026-09-10T12:00:00Z', now), -10);
  assert.equal(daysUntil('not a date', now), null);
});

test('worstState and summarize report the worst thing that happened', () => {
  const probes = [
    { name: 'A', state: 'ok', detail: '' },
    { name: 'B', state: 'warn', detail: '' },
    { name: 'C', state: 'fail', detail: '' },
  ];
  assert.equal(worstState(probes), 'fail');
  assert.match(summarize(probes), /1 of 3 checks failed: C\./);

  const warned = probes.slice(0, 2);
  assert.equal(worstState(warned), 'warn');
  assert.match(summarize(warned), /1 warning\(s\): B\./);

  const fine = probes.slice(0, 1);
  assert.equal(worstState(fine), 'ok');
  assert.equal(summarize(fine), 'All 1 checks passed.');
});

test('a healthy setup reports ok on every probe', async () => {
  resetWatch();
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage() });
  assert.equal(worstState(probes), 'ok');
  assert.match(find(probes, 'Data files').detail, /results\.json 1, drivers\.json 1, events\.json 1/);
  assert.equal(find(probes, 'Contract').state, 'ok');
});

test('an unreachable GitHub fails its probe without failing the run', async () => {
  resetWatch();
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ fail: true }) });
  assert.equal(find(probes, 'GitHub').state, 'fail');
  assert.equal(find(probes, 'Rate limit').state, 'fail');
  // The other probes still answered.
  assert.equal(find(probes, 'Process').state, 'ok');
  assert.equal(worstState(probes), 'fail');
});

test('a token close to its expiry warns, and an expired one fails', async () => {
  resetWatch();
  const soon = new Date(Date.now() + (TOKEN_EXPIRY_WARN_DAYS - 1) * 86400000).toISOString();
  const warned = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ expiry: soon }) });
  assert.equal(find(warned, 'Token').state, 'warn');
  assert.equal(worstState(warned), 'warn');

  const past = new Date(Date.now() - 2 * 86400000).toISOString();
  const failed = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ expiry: past }) });
  assert.equal(find(failed, 'Token').state, 'fail');
});

test('a token type that reports no expiry is not a problem', async () => {
  resetWatch();
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ expiry: null }) });
  assert.equal(find(probes, 'Token').state, 'ok');
  assert.match(find(probes, 'Token').detail, /no expiry/);
});

test('a nearly spent rate limit warns', async () => {
  resetWatch();
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ remaining: 12 }) });
  assert.equal(find(probes, 'Rate limit').state, 'warn');
});

test('an invalid data file is a contract failure, not an unreadable file', async () => {
  resetWatch();
  const broken = { ...FILE_TEXT, drivers: JSON.stringify([{ id: 'x' }], null, 2) };
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ files: broken }) });
  assert.equal(find(probes, 'Data files').state, 'ok');
  assert.equal(find(probes, 'Contract').state, 'fail');
  assert.match(find(probes, 'Contract').detail, /drivers\.json/);
});

test('an unreadable data file fails the file probe and leaves the contract unchecked', async () => {
  resetWatch();
  const broken = { ...FILE_TEXT, events: '{ not json' };
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage({ files: broken }) });
  assert.equal(find(probes, 'Data files').state, 'fail');
  assert.equal(find(probes, 'Contract').state, 'warn');
});

test('a configured channel the bot cannot post in fails, which nothing else surfaces', async () => {
  resetWatch();
  const client = {
    user: { id: '1', tag: 'artemis#0001' },
    isReady: () => true,
    ws: { ping: 42 },
    channels: {
      fetch: async (id) => ({
        name: id === '111' ? 'bot-log' : 'results',
        send: () => {},
        // The audit channel is missing Embed Links.
        permissionsFor: () => ({
          has: (flag) => !(id === '111' && flag === PermissionFlagsBits.EmbedLinks),
        }),
      }),
    },
  };
  const config = { ...baseConfig, logChannelId: '111', resultsChannelId: '222' };
  const probes = await runProbes({ config, storage: fakeGithubStorage(), client });

  assert.equal(find(probes, 'Discord').state, 'ok');
  assert.equal(find(probes, 'Audit channel').state, 'fail');
  assert.match(find(probes, 'Audit channel').detail, /Embed Links/);
  assert.equal(find(probes, 'Results channel').state, 'ok');
});

test('a channel that cannot be found fails rather than throwing', async () => {
  resetWatch();
  const client = {
    user: { id: '1', tag: 'artemis#0001' },
    isReady: () => true,
    ws: { ping: 42 },
    channels: { fetch: async () => Promise.reject(new Error('Unknown Channel')) },
  };
  const probes = await runProbes({
    config: { ...baseConfig, logChannelId: '999' },
    storage: fakeGithubStorage(),
    client,
  });
  assert.equal(find(probes, 'Audit channel').state, 'fail');
  assert.match(find(probes, 'Audit channel').detail, /cannot be found/);
});

test('channels that are switched off are reported as such, not as failures', async () => {
  resetWatch();
  const client = {
    user: { id: '1', tag: 'artemis#0001' },
    isReady: () => true,
    ws: { ping: 42 },
    channels: { fetch: async () => null },
  };
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage(), client });
  assert.equal(find(probes, 'Audit channel').state, 'ok');
  assert.match(find(probes, 'Audit channel').detail, /LOG_CHANNEL_ID is not set/);
  assert.match(find(probes, 'Results channel').detail, /RESULTS_CHANNEL_ID is not set/);
});

test('a gateway that is not ready fails the Discord probe', async () => {
  resetWatch();
  const client = { user: null, isReady: () => false, ws: { ping: -1 }, channels: { fetch: async () => null } };
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage(), client });
  assert.equal(find(probes, 'Discord').state, 'fail');
});

test('no client at all means the Discord probes are skipped, which is how npm run check uses it', async () => {
  resetWatch();
  const probes = await runProbes({ config: baseConfig, storage: fakeGithubStorage() });
  assert.equal(find(probes, 'Discord'), undefined);
  assert.equal(find(probes, 'Audit channel'), undefined);
  assert.equal(find(probes, 'GitHub').state, 'ok');
});

test('local storage mode reports the GitHub probes as not applicable', async () => {
  resetWatch();
  const storage = {
    mode: 'local',
    describe: () => 'local files in ./sample-data',
    async readFile(kind) {
      return { text: FILE_TEXT[kind], sha: 'abc' };
    },
    async readOptionalFile() {
      return null;
    },
  };
  const probes = await runProbes({ config: { ...baseConfig, storage: 'local' }, storage });
  assert.equal(worstState(probes), 'ok');
  assert.match(find(probes, 'Storage').detail, /nothing is pushed/);
  assert.match(find(probes, 'Deploy watch').detail, /local storage mode/);
});

test('deploy watch reports being switched off, and the state is not a failure', async () => {
  resetWatch();
  const probes = await runProbes({
    config: { ...baseConfig, deployWatch: false },
    storage: fakeGithubStorage(),
  });
  assert.equal(find(probes, 'Deploy watch').state, 'ok');
  assert.match(find(probes, 'Deploy watch').detail, /DEPLOY_WATCH=off/);
});
