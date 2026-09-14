/**
 * config.js
 *
 * Reads every setting from environment variables (a .env file is loaded first,
 * see .env.example), validates them and fails fast with a readable list of what
 * is missing or wrong. Nothing else in the bot reads process.env directly.
 *
 * Secrets are registered with the logger as soon as they are read, so they can
 * never appear in a log line.
 */

import { config as loadDotenv } from 'dotenv';
import { log, registerSecret, setLevel } from './log.js';

/** Discord ids are snowflakes: 15 to 22 digits in practice. */
const SNOWFLAKE_PATTERN = /^\d{1,25}$/;

/** GitHub owner and repository name characters. */
const REPO_PATTERN = /^[A-Za-z0-9._-]+$/;

/** Git branch names: no spaces, no control characters, not starting with a dash. */
const BRANCH_PATTERN = /^[^\s~^:?*[\\]+$/;

/**
 * @typedef {object} BotConfig
 * @property {string} discordToken
 * @property {string} discordClientId
 * @property {string} discordGuildId
 * @property {'local'|'github'} storage
 * @property {string} dataDir
 * @property {string} githubToken
 * @property {string} githubOwner
 * @property {string} githubRepo
 * @property {string} githubBranch
 * @property {string} githubApiBase
 * @property {string} logChannelId empty when auditing is off
 * @property {string} resultsChannelId empty when the public results announcement is off
 * @property {string} logLevel
 */

/**
 * Read one variable, trimmed. Returns the fallback when unset or empty.
 * @param {string} name
 * @param {string} [fallback]
 * @returns {string}
 */
function read(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Build and validate the configuration.
 *
 * @param {{ loadEnvFile?: boolean }} [options]
 * @returns {{ ok: boolean, errors: string[], config: BotConfig }}
 */
export function buildConfig(options = {}) {
  if (options.loadEnvFile !== false) loadDotenv();

  const storageRaw = read('STORAGE', 'github').toLowerCase();
  const config = {
    discordToken: read('DISCORD_TOKEN'),
    discordClientId: read('DISCORD_CLIENT_ID'),
    discordGuildId: read('DISCORD_GUILD_ID'),
    storage: storageRaw === 'local' ? 'local' : storageRaw === 'github' ? 'github' : storageRaw,
    dataDir: read('DATA_DIR', 'src/data'),
    githubToken: read('GITHUB_TOKEN'),
    githubOwner: read('GITHUB_OWNER'),
    githubRepo: read('GITHUB_REPO'),
    githubBranch: read('GITHUB_BRANCH'),
    githubApiBase: read('GITHUB_API_BASE', 'https://api.github.com').replace(/\/+$/, ''),
    logChannelId: read('LOG_CHANNEL_ID'),
    resultsChannelId: read('RESULTS_CHANNEL_ID'),
    logLevel: read('LOG_LEVEL', 'info').toLowerCase(),
  };

  registerSecret(config.discordToken);
  registerSecret(config.githubToken);
  setLevel(config.logLevel);

  const errors = [];

  if (!config.discordToken) errors.push('DISCORD_TOKEN is missing. Copy it from the Bot page of your Discord application.');
  if (!config.discordClientId) {
    errors.push('DISCORD_CLIENT_ID is missing. It is the Application Id on the General Information page.');
  } else if (!SNOWFLAKE_PATTERN.test(config.discordClientId)) {
    errors.push('DISCORD_CLIENT_ID must be a numeric Discord id.');
  }
  if (!config.discordGuildId) {
    errors.push('DISCORD_GUILD_ID is missing. Right click the server in Discord and choose Copy Server Id.');
  } else if (!SNOWFLAKE_PATTERN.test(config.discordGuildId)) {
    errors.push('DISCORD_GUILD_ID must be a numeric Discord id.');
  }

  if (config.storage !== 'local' && config.storage !== 'github') {
    errors.push(`STORAGE must be "local" or "github", found "${storageRaw}".`);
  }

  if (!config.dataDir) errors.push('DATA_DIR must not be empty.');

  if (config.storage === 'github') {
    if (!config.githubToken) {
      errors.push('GITHUB_TOKEN is missing. Create a fine-grained token with Contents read and write.');
    }
    if (!config.githubOwner) errors.push('GITHUB_OWNER is missing, for example cesarvigils.');
    else if (!REPO_PATTERN.test(config.githubOwner)) errors.push('GITHUB_OWNER contains characters GitHub does not allow.');
    if (!config.githubRepo) errors.push('GITHUB_REPO is missing, for example Artemis-Website.');
    else if (!REPO_PATTERN.test(config.githubRepo)) errors.push('GITHUB_REPO contains characters GitHub does not allow.');
    if (!config.githubBranch) errors.push('GITHUB_BRANCH is missing, for example maintenance.');
    else if (!BRANCH_PATTERN.test(config.githubBranch)) errors.push('GITHUB_BRANCH is not a valid branch name.');
  }

  if (config.logChannelId && !SNOWFLAKE_PATTERN.test(config.logChannelId)) {
    errors.push('LOG_CHANNEL_ID must be a numeric Discord channel id, or left empty.');
  }

  if (config.resultsChannelId && !SNOWFLAKE_PATTERN.test(config.resultsChannelId)) {
    errors.push('RESULTS_CHANNEL_ID must be a numeric Discord channel id, or left empty.');
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    errors.push('LOG_LEVEL must be one of: debug, info, warn, error.');
  }

  return { ok: errors.length === 0, errors, config: Object.freeze(config) };
}

/**
 * Build the configuration or stop the process with a readable report.
 * @param {{ loadEnvFile?: boolean }} [options]
 * @returns {BotConfig}
 */
export function loadConfigOrExit(options = {}) {
  const { ok, errors, config } = buildConfig(options);
  if (!ok) {
    log.error(`Configuration is not usable. ${errors.length} problem(s) found:`);
    for (const error of errors) log.error(`  - ${error}`);
    log.error('Fix the values in your .env file. See .env.example for the full list.');
    process.exit(1);
  }
  return config;
}

/**
 * One line describing where data is read from and written to. Never includes a token.
 * @param {BotConfig} config
 * @returns {string}
 */
export function describeStorage(config) {
  if (config.storage === 'local') return `local files in ${config.dataDir}`;
  return `${config.githubOwner}/${config.githubRepo} on branch ${config.githubBranch}, folder ${config.dataDir}`;
}
