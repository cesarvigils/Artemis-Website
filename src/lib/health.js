/**
 * health.js
 *
 * The probes behind /health, `npm run check` and the optional heartbeat.
 *
 * A probe answers one question about whether the bot can do its job, and it
 * answers it every time: a probe that cannot reach what it is checking returns
 * a failing result rather than throwing. One dead probe must never take the
 * command, the check script or the heartbeat with it.
 *
 * Every probe returns:
 *   { name, state: 'ok' | 'warn' | 'fail', detail: string }
 *
 * The probes that need Discord (gateway ping, the two channels) are skipped
 * when no client is supplied, which is how `npm run check` reuses this file
 * without logging in.
 *
 * Nothing here writes anything.
 */

import { PermissionFlagsBits } from 'discord.js';
import { FILES, KINDS, STATS_FILE } from './schema.js';
import { readRecords } from './storage.js';
import { readStatsSummary } from './stats.js';
import { describeStorage } from './config.js';
import { lastWatch, watchState } from './deploy-watch.js';
import { log } from './log.js';

/** Worst first: used to roll the probe list up into one verdict. */
export const STATES = Object.freeze(['fail', 'warn', 'ok']);

/** A token with fewer days left than this is reported as a warning. */
export const TOKEN_EXPIRY_WARN_DAYS = 14;

/** Below this share of the hourly GitHub quota, the rate limit is a warning. */
const RATE_LIMIT_WARN_FRACTION = 0.1;

/** Permissions the bot needs in the audit and results channels. */
const CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

/** How long one probe may take before it is reported as a failure. */
const PROBE_TIMEOUT_MS = 10000;

/**
 * @typedef {{ name: string, state: 'ok'|'warn'|'fail', detail: string }} Probe
 */

/**
 * Build one probe result.
 * @param {string} name
 * @param {'ok'|'warn'|'fail'} state
 * @param {string} detail
 * @returns {Probe}
 */
function probe(name, state, detail) {
  return { name, state, detail };
}

/**
 * Run one probe body, turning a throw or a hang into a failing result.
 * @param {string} name
 * @param {() => Promise<Probe>} body
 * @returns {Promise<Probe>}
 */
async function safely(name, body) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(probe(name, 'fail', `No answer within ${PROBE_TIMEOUT_MS / 1000} seconds.`)), PROBE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([body(), timeout]);
  } catch (error) {
    log.debug(`Health probe "${name}" failed`, error?.message ?? error);
    return probe(name, 'fail', String(error?.message ?? error));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The worst state in a list of probes.
 * @param {Probe[]} probes
 * @returns {'ok'|'warn'|'fail'}
 */
export function worstState(probes) {
  for (const state of STATES) {
    if (probes.some((entry) => entry.state === state)) return state;
  }
  return 'ok';
}

/**
 * One sentence summing the whole list up.
 * @param {Probe[]} probes
 * @returns {string}
 */
export function summarize(probes) {
  const failed = probes.filter((entry) => entry.state === 'fail');
  const warned = probes.filter((entry) => entry.state === 'warn');
  if (failed.length > 0) {
    return `${failed.length} of ${probes.length} checks failed: ${failed.map((entry) => entry.name).join(', ')}.`;
  }
  if (warned.length > 0) {
    return `Working, with ${warned.length} warning(s): ${warned.map((entry) => entry.name).join(', ')}.`;
  }
  return `All ${probes.length} checks passed.`;
}

/**
 * Human readable process uptime, for example "3d 4h 12m".
 * @param {number} seconds
 * @returns {string}
 */
export function formatUptime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const days = Math.floor(whole / 86400);
  const hours = Math.floor((whole % 86400) / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${whole % 60}s`;
}

/**
 * Whole days from now until an instant, negative once it has passed.
 * @param {string} value anything Date.parse understands
 * @param {Date} [now]
 * @returns {number | null} null when the value is not a date
 */
export function daysUntil(value, now = new Date()) {
  const at = Date.parse(value);
  if (Number.isNaN(at)) return null;
  return Math.floor((at - now.getTime()) / 86400000);
}

/* Individual probes ---------------------------------------------------- */

/**
 * The process itself. This one cannot fail; it is context for the rest.
 * @param {{ version?: string }} [options]
 * @returns {Probe}
 */
function processProbe(options = {}) {
  const version = options.version ? `bot ${options.version}, ` : '';
  return probe('Process', 'ok', `Up ${formatUptime(process.uptime())}, ${version}Node ${process.version}`);
}

/**
 * The gateway connection.
 * @param {import('discord.js').Client} client
 * @returns {Probe}
 */
function discordProbe(client) {
  if (!client?.isReady?.()) return probe('Discord', 'fail', 'The gateway connection is not ready.');
  const ping = Math.round(client.ws.ping);
  // discord.js reports -1 until the first heartbeat has been acknowledged.
  if (!Number.isFinite(ping) || ping < 0) {
    return probe('Discord', 'warn', 'Connected, but no heartbeat has been acknowledged yet.');
  }
  return probe('Discord', 'ok', `Connected as ${client.user?.tag ?? 'unknown'}, gateway ${ping} ms`);
}

/**
 * An authenticated round trip to the configured repository and branch. This is
 * the probe that catches an expired or wrongly scoped token.
 * @param {object} storage
 * @param {import('./config.js').BotConfig} config
 * @returns {Promise<Probe>}
 */
async function githubProbe(storage, config) {
  if (storage.mode !== 'github') {
    return probe('Storage', 'ok', `Local files in ${config.dataDir}, nothing is pushed`);
  }
  const { owner, repo, branch } = storage.target;
  const started = Date.now();
  const { status, body } = await storage.request(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
  );
  if (status !== 200) throw storage.toError(status, body, `read branch ${branch}`);
  return probe('GitHub', 'ok', `${describeStorage(config)}, reachable in ${Date.now() - started} ms`);
}

/**
 * How long the fine-grained token has left, from the header GitHub attaches to
 * every authenticated response. Silent for token types that do not say.
 * @param {object} storage
 * @returns {Probe}
 */
function tokenProbe(storage) {
  if (storage.mode !== 'github') return probe('Token', 'ok', 'Not used in local storage mode');
  const expiry = storage.tokenExpiry?.();
  if (!expiry) {
    return probe('Token', 'ok', 'Accepted; GitHub reports no expiry for this token type');
  }
  const days = daysUntil(expiry);
  if (days === null) return probe('Token', 'ok', `Accepted; GitHub reports expiry "${expiry}"`);
  if (days < 0) return probe('Token', 'fail', `Expired ${Math.abs(days)} day(s) ago (${expiry})`);
  if (days <= TOKEN_EXPIRY_WARN_DAYS) {
    return probe('Token', 'warn', `Expires in ${days} day(s), on ${expiry}. Create a replacement now.`);
  }
  return probe('Token', 'ok', `Valid for another ${days} day(s), until ${expiry}`);
}

/**
 * The remaining GitHub API quota.
 * @param {object} storage
 * @returns {Promise<Probe>}
 */
async function rateLimitProbe(storage) {
  if (storage.mode !== 'github') return probe('Rate limit', 'ok', 'Not used in local storage mode');
  const { status, body } = await storage.request('/rate_limit');
  if (status !== 200) throw storage.toError(status, body, 'read the rate limit');
  const core = body?.resources?.core ?? body?.rate;
  if (!core) return probe('Rate limit', 'warn', 'GitHub did not report a core quota.');
  const resetAt = new Date(Number(core.reset) * 1000).toISOString().slice(11, 16);
  const detail = `${core.remaining} of ${core.limit} requests left, resets at ${resetAt} UTC`;
  const low = core.remaining < core.limit * RATE_LIMIT_WARN_FRACTION;
  return probe('Rate limit', low ? 'warn' : 'ok', detail);
}

/**
 * All three data files: readable, parseable, and valid against the contract.
 * Reported as two probes, because "cannot read the file" and "the file is
 * invalid" call for different fixes.
 * @param {object} storage
 * @returns {Promise<Probe[]>}
 */
async function dataProbes(storage) {
  const counts = [];
  const unreadable = [];
  const invalid = [];

  for (const kind of KINDS) {
    try {
      // validate: false so an invalid file is still counted and reported as a
      // contract problem rather than as an unreadable one.
      const { records, errors } = await readRecords(storage, kind, { validate: false });
      counts.push(`${FILES[kind]} ${records.length}`);
      if (errors.length > 0) invalid.push(`${FILES[kind]} (${errors.length})`);
    } catch (error) {
      unreadable.push(`${FILES[kind]}: ${error?.message ?? error}`);
    }
  }

  const files =
    unreadable.length > 0
      ? probe('Data files', 'fail', unreadable.join('; '))
      : probe('Data files', 'ok', `${counts.join(', ')} record(s)`);

  const contract =
    unreadable.length > 0
      ? probe('Contract', 'warn', 'Not checked: a file could not be read.')
      : invalid.length > 0
        ? probe('Contract', 'fail', `Problems in ${invalid.join(', ')}. Run /data validate for the list.`)
        : probe('Contract', 'ok', 'Every record matches the data contract');

  return [files, contract];
}

/**
 * The generated file the bot does not own. Never a failure: a missing or stale
 * stats.json does not stop the bot doing its job.
 * @param {object} storage
 * @returns {Promise<Probe>}
 */
async function statsProbe(storage) {
  if (typeof storage.readOptionalFile !== 'function') {
    return probe('Sync file', 'ok', `${STATS_FILE} is not checked by this storage mode`);
  }
  const summary = await readStatsSummary(storage);
  if (!summary.found) {
    return probe('Sync file', 'ok', `${STATS_FILE} has not been generated yet`);
  }
  if (!summary.ok) {
    return probe('Sync file', 'warn', `${STATS_FILE} could not be read: ${summary.error}`);
  }
  return probe(
    'Sync file',
    'ok',
    `${STATS_FILE} holds ${summary.driverCount} driver entr(ies), updated ${summary.updated}`,
  );
}

/**
 * One configured channel: does it exist, and can the bot actually post there?
 *
 * This is the only thing that surfaces a wrong channel id, because postAudit
 * and postResultAnnouncement swallow their own failures on purpose.
 *
 * @param {import('discord.js').Client} client
 * @param {string} name probe name
 * @param {string} channelId empty when the feature is switched off
 * @param {string} offDetail what to say when it is switched off
 * @returns {Promise<Probe>}
 */
async function channelProbe(client, name, channelId, offDetail) {
  if (!channelId) return probe(name, 'ok', offDetail);
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return probe(name, 'fail', `Channel ${channelId} cannot be found or is not visible to the bot.`);
  if (typeof channel.send !== 'function') {
    return probe(name, 'fail', `Channel ${channelId} cannot receive messages.`);
  }
  const mine = channel.permissionsFor?.(client.user);
  const missing = CHANNEL_PERMISSIONS.filter((flag) => !mine?.has(flag));
  if (missing.length > 0) {
    return probe(name, 'fail', `Missing View Channel, Send Messages or Embed Links in #${channel.name ?? channelId}.`);
  }
  return probe(name, 'ok', `#${channel.name ?? channelId}`);
}

/**
 * Whether a write is followed until the build finishes, and how the last one went.
 * @param {import('./config.js').BotConfig} config
 * @param {object} storage
 * @returns {Probe}
 */
function deployWatchProbe(config, storage) {
  if (storage.mode !== 'github') return probe('Deploy watch', 'ok', 'Not used in local storage mode');
  if (!config.deployWatch) return probe('Deploy watch', 'ok', 'Switched off with DEPLOY_WATCH=off');
  if (watchState() === 'unavailable') {
    return probe(
      'Deploy watch',
      'warn',
      'The token cannot read checks. Add Checks: Read and Commit statuses: Read to it.',
    );
  }
  const last = lastWatch();
  if (!last) return probe('Deploy watch', 'ok', 'On; no write has been followed yet this session');
  if (last.state === 'failure') {
    return probe('Deploy watch', 'fail', `The build for ${last.shortSha} failed: ${last.detail}`);
  }
  return probe('Deploy watch', 'ok', `On; the build for ${last.shortSha} ${last.detail}`);
}

/* The runner ------------------------------------------------------------ */

/**
 * Run every probe that applies and return the results in display order.
 *
 * @param {{
 *   config: import('./config.js').BotConfig,
 *   storage: object,
 *   client?: import('discord.js').Client | null,
 *   version?: string
 * }} ctx
 * @returns {Promise<Probe[]>}
 */
export async function runProbes(ctx) {
  const { config, storage, client } = ctx;

  const withDiscord = client
    ? [
        safely('Discord', async () => discordProbe(client)),
        safely('Audit channel', () =>
          channelProbe(client, 'Audit channel', config.logChannelId, 'Switched off; LOG_CHANNEL_ID is not set'),
        ),
        safely('Results channel', () =>
          channelProbe(
            client,
            'Results channel',
            config.resultsChannelId,
            'Switched off; RESULTS_CHANNEL_ID is not set',
          ),
        ),
      ]
    : [];

  const [discord, audit, results] = await Promise.all(withDiscord);

  const [github, rateLimit, data, stats] = await Promise.all([
    safely('GitHub', () => githubProbe(storage, config)),
    safely('Rate limit', () => rateLimitProbe(storage)),
    safely('Data files', () => dataProbes(storage)),
    safely('Sync file', () => statsProbe(storage)),
  ]);

  // Read last, because the expiry it reports comes from a header carried by the
  // calls the probes above have just made.
  const token = await safely('Token', async () => tokenProbe(storage));

  return [
    processProbe({ version: ctx.version }),
    ...(discord ? [discord] : []),
    github,
    token,
    rateLimit,
    ...(Array.isArray(data) ? data : [data]),
    stats,
    deployWatchProbe(config, storage),
    ...(audit ? [audit] : []),
    ...(results ? [results] : []),
  ];
}
