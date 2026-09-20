/**
 * heartbeat.js
 *
 * Optional dead man's switch. When HEARTBEAT_URL is set, the bot pings it every
 * few minutes; when a ping stops arriving, the service on the other end raises
 * the alarm.
 *
 * The bot is a long running gateway process. Nothing else notices when it
 * stops: Discord simply shows the commands greyed out, and the team finds out
 * the next time somebody tries to add a result.
 *
 * The ping is not a bare "still running": it runs the same probes /health runs,
 * and reports a failure to <url>/fail. A bot that is connected to Discord but
 * cannot reach GitHub is not healthy, and a plain liveness ping would hide
 * exactly that.
 *
 * Failures here are logged and swallowed. Monitoring must never be able to
 * affect the thing it monitors.
 */

import { runProbes, summarize, worstState } from './health.js';
import { log } from './log.js';

/** How often the switch is pinged. */
export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

/** How long one ping may take. */
const PING_TIMEOUT_MS = 10000;

/**
 * Send one ping, carrying the current verdict.
 *
 * @param {{ config: import('./config.js').BotConfig, storage: object, client?: object }} ctx
 * @returns {Promise<'ok'|'warn'|'fail'|'error'>}
 */
export async function sendHeartbeat(ctx) {
  const { config } = ctx;
  if (!config.heartbeatUrl) return 'ok';

  let state = 'fail';
  let summary = 'The probes could not be run.';
  try {
    const probes = await runProbes(ctx);
    state = worstState(probes);
    summary = summarize(probes);
  } catch (error) {
    summary = String(error?.message ?? error);
  }

  // A warning is still a working bot, so only a failure trips the switch.
  const url = state === 'fail' ? `${config.heartbeatUrl.replace(/\/+$/, '')}/fail` : config.heartbeatUrl;

  try {
    await fetch(url, {
      method: 'POST',
      body: summary,
      headers: { 'Content-Type': 'text/plain', 'User-Agent': 'artemis-data-bot' },
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    log.debug(`Heartbeat sent: ${state}`);
  } catch (error) {
    // The monitor being unreachable is the monitor's problem, not the bot's.
    log.warn('Could not send the heartbeat', error?.message ?? error);
    return 'error';
  }

  return /** @type {'ok'|'warn'|'fail'} */ (state);
}

/**
 * Start pinging. Returns the function that stops it again, or null when no
 * URL is configured.
 *
 * @param {{ config: import('./config.js').BotConfig, storage: object, client?: object }} ctx
 * @returns {(() => void) | null}
 */
export function startHeartbeat(ctx) {
  if (!ctx.config.heartbeatUrl) return null;

  log.info(`Heartbeat on, every ${HEARTBEAT_INTERVAL_MS / 60000} minutes`);
  void sendHeartbeat(ctx);

  const timer = setInterval(() => void sendHeartbeat(ctx), HEARTBEAT_INTERVAL_MS);
  // Never hold the process open just for the heartbeat.
  if (typeof timer.unref === 'function') timer.unref();

  return () => clearInterval(timer);
}

export default startHeartbeat;
