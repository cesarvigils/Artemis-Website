/**
 * permissions.js
 *
 * Only members with the Discord "Manage Server" permission may use any command.
 *
 * The rule is enforced twice, on purpose:
 *
 *  1. At registration. Every command is built with
 *     setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild) and
 *     setDMPermission(false), so Discord hides the commands from everyone else
 *     and refuses them in direct messages.
 *  2. At run time, here. A server administrator can override the default with a
 *     channel or role permission in Server Settings, so the bot checks the
 *     caller's own permissions again before doing any work.
 */

import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { errorEmbed } from './embeds.js';
import { log } from './log.js';

/** The single permission that grants access to this bot. */
export const REQUIRED_PERMISSION = PermissionFlagsBits.ManageGuild;

/** Wording of the refusal, kept short and plain. */
export const REFUSAL_TEXT = 'You need the Manage Server permission to use this command.';

/**
 * True when the interaction was sent by a member who may use the bot.
 * @param {import('discord.js').BaseInteraction & { memberPermissions?: import('discord.js').PermissionsBitField | null }} interaction
 * @returns {boolean}
 */
export function isAllowed(interaction) {
  // memberPermissions is null in direct messages, where the bot is not usable.
  return Boolean(interaction.memberPermissions?.has(REQUIRED_PERMISSION));
}

/**
 * Check the caller and, when they are not allowed, reply ephemerally and log it.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>} true when the command may continue
 */
export async function ensureAllowed(interaction) {
  if (isAllowed(interaction)) return true;

  log.warn('Refused a command', {
    user: interaction.user?.tag ?? interaction.user?.username,
    userId: interaction.user?.id,
    command: interaction.commandName,
    guild: interaction.guildId,
  });

  const embed = errorEmbed({
    title: 'Not allowed',
    message: REFUSAL_TEXT,
    details: ['Ask a server administrator if you should have it.'],
  });

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ embeds: [embed] });
  } else {
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }
  return false;
}
