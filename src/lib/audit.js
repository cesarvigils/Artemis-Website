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
import { infoEmbed, resultAnnouncementEmbed } from './embeds.js';
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

/**
 * Post the public results announcement for one /result add, when
 * RESULTS_CHANNEL_ID is set. Unlike postAudit above, this message is sent
 * plainly (not ephemeral) and uses the brand's locked template, not the house
 * embed style: see embeds.js resultAnnouncementEmbed.
 *
 * A posting failure never breaks the command: it is logged here, and the
 * caller decides what, if anything, to tell the operator.
 *
 * @param {import('discord.js').Client} client
 * @param {import('./config.js').BotConfig} config
 * @param {Record<string, any>} record a result record, already written
 * @returns {Promise<{ posted: boolean }>}
 */
export async function postResultAnnouncement(client, config, record) {
  if (!config.resultsChannelId) return { posted: false };

  try {
    const channel = await client.channels.fetch(config.resultsChannelId);
    if (!channel || typeof channel.send !== 'function') {
      log.warn('Results channel cannot receive messages', { channel: config.resultsChannelId });
      return { posted: false };
    }
    await channel.send({ embeds: [resultAnnouncementEmbed(record)] });
    return { posted: true };
  } catch (error) {
    // Never let the announcement affect the command the operator ran.
    log.warn('Could not post the results announcement', error?.message ?? error);
    return { posted: false };
  }
}

export default postAudit;
