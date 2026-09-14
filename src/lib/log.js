/**
 * log.js
 *
 * Timestamped logging to stdout (stderr for errors), with secret redaction.
 *
 * Two layers of protection:
 *  1. Values registered with registerSecret() are replaced wherever they appear.
 *  2. Anything that looks like a GitHub or Discord token is replaced by pattern,
 *     so a secret that was never registered still does not reach the log.
 *
 * No emojis, no colour codes: the output is meant to be readable in a plain
 * terminal and in a pm2 log file.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

/** Literal secret values to strip from every log line. */
const secrets = new Set();

/** Token shapes that are redacted even when the exact value is unknown. */
const SECRET_PATTERNS = [
  /github_pat_[A-Za-z0-9_]{20,}/g, // fine-grained personal access token
  /gh[pousr]_[A-Za-z0-9]{20,}/g, // classic personal access token and friends
  /\b[A-Za-z0-9_-]{24,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b/g, // Discord bot token
];

let currentLevel = LEVELS.info;

/**
 * Where debug and info lines go. Warnings and errors always go to stderr.
 * A script that prints data on stdout (register-commands.js with --dry-run)
 * moves them to stderr so its output stays machine readable.
 */
let infoStream = process.stdout;

/** Send debug and info lines to stderr instead of stdout. */
export function sendInfoToStderr() {
  infoStream = process.stderr;
}

/**
 * Set the minimum level that is printed.
 * @param {string} [level] one of debug, info, warn, error
 */
export function setLevel(level) {
  const wanted = LEVELS[String(level || '').toLowerCase()];
  if (wanted) currentLevel = wanted;
}

/**
 * Register a literal secret so it is never printed.
 * Ignores short or empty values, which would over-redact.
 * @param {string | undefined | null} value
 */
export function registerSecret(value) {
  if (typeof value === 'string' && value.length >= 8) secrets.add(value);
}

/**
 * Replace every known or token-shaped secret in a string.
 * @param {string} text
 * @returns {string}
 */
export function redact(text) {
  let out = String(text);
  for (const secret of secrets) {
    if (secret && out.includes(secret)) out = out.split(secret).join('[redacted]');
  }
  for (const pattern of SECRET_PATTERNS) out = out.replace(pattern, '[redacted]');
  return out;
}

/**
 * Render any value for a log line. Errors become "name: message" plus the stack.
 * @param {unknown} value
 * @returns {string}
 */
function render(value) {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ''}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Write one line.
 * @param {keyof typeof LEVELS} level
 * @param {string} message
 * @param {unknown} [detail] optional extra value appended after the message
 */
function write(level, message, detail) {
  if (LEVELS[level] < currentLevel) return;
  const parts = [new Date().toISOString(), level.toUpperCase(), render(message)];
  const extra = render(detail);
  if (extra) parts.push(extra);
  const line = redact(parts.join(' '));
  if (level === 'error' || level === 'warn') process.stderr.write(`${line}\n`);
  else infoStream.write(`${line}\n`);
}

export const log = {
  debug: (message, detail) => write('debug', message, detail),
  info: (message, detail) => write('info', message, detail),
  warn: (message, detail) => write('warn', message, detail),
  error: (message, detail) => write('error', message, detail),
};

export default log;
