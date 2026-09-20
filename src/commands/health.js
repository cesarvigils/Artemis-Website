/**
 * commands/health.js
 *
 * /health - is the bot actually able to do its job right now?
 *
 * This is the counterpart to /data status, which answers questions about the
 * data. This answers questions about the bot: is the GitHub token still valid
 * and for how much longer, can the repository be reached, is there API quota
 * left, can the bot post in the channels it was given, and is it following the
 * builds it starts.
 *
 * Every one of those can fail silently today. The audit and announcement posts
 * swallow their own errors on purpose, so a wrong channel id is invisible until
 * someone notices the posts are missing; a token expires without a word.
 *
 * The probes live in src/lib/health.js, shared with `npm run check` and the
 * heartbeat, so the three can never disagree. Nothing here writes anything.
 */

import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { runProbes, summarize, worstState } from '../lib/health.js';
import { healthEmbed } from '../lib/embeds.js';
import { replyEphemeral } from './shared.js';

export const data = new SlashCommandBuilder()
  .setName('health')
  .setDescription('Check that the bot can reach Discord, GitHub and its channels')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

/**
 * Run every probe and report.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: import('../lib/config.js').BotConfig, client: import('discord.js').Client }} ctx
 * @returns {Promise<void>}
 */
export async function execute(interaction, ctx) {
  const probes = await runProbes({
    config: ctx.config,
    storage: ctx.storage,
    client: ctx.client,
    version: ctx.version,
  });

  await replyEphemeral(interaction, {
    embeds: [healthEmbed({ probes, state: worstState(probes), summary: summarize(probes) })],
  });
}

export default { data, execute };
