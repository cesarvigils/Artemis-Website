/**
 * audit.js
 *
 * Optional change log. When LOG_CHANNEL_ID is set, every write posts a compact
 * embed in that channel: who ran the command, what changed, and the commit.
 *
 * The audit post can never break a command. If the channel is missing, or the
 * bot cannot post in it, the failure is logged and the command still succeeds.
 *
 * The bot needs View Channel, Send Messages and Embed Links in that channel.
 */

import { FILES } from './schema.js';
import { infoEmbed } from './embeds.js';
import { log } from './log.js';

/**
 * Post one change to the audit channel, if one is configured.
 *
 * @param {import('discord.js').Client} client
 * @param {import('./config.js').BotConfig} config
 * @param {{
 *   action: 'add'|'edit'|'remove',
 *   kind: 'results'|'drivers'|'events',
 *   id: string,
 *   summary?: string,
 *   commit?: { shortSha?: string, url?: string | null },
 *   actor: { username: string, id: string }
 * }} change
 * @returns {Promise<void>}
 */
export async function postAudit(client, config, change) {
  if (!config.logChannelId) return;

  try {
    const channel = await client.channels.fetch(config.logChannelId);
    if (!channel || typeof channel.send !== 'function') {
      log.warn('Audit channel cannot receive messages', { channel: config.logChannelId });
      return;
    }

    const fields = [
      { name: 'Change', value: `${change.action} in ${FILES[change.kind]}`, inline: true },
      { name: 'Record', value: change.id, inline: true },
      { name: 'By', value: `${change.actor.username} (${change.actor.id})`, inline: true },
    ];
    if (change.summary) fields.push({ name: 'Summary', value: change.summary });
    fields.push({
      name: 'Commit',
      value: change.commit?.shortSha
        ? change.commit.url
          ? `${change.commit.shortSha} - ${change.commit.url}`
          : change.commit.shortSha
        : 'local write, no commit',
    });

    await channel.send({ embeds: [infoEmbed({ title: 'Data change', fields })] });
  } catch (error) {
    // Never let the audit post affect the command the operator ran.
    log.warn('Could not post to the audit channel', error?.message ?? error);
  }
}

export default postAudit;
