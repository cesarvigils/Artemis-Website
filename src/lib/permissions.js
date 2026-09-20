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

/** Wording used when the command arrives from a server the bot does not serve. */
export const WRONG_GUILD_TEXT = 'This bot only answers in the Artemis team server.';

/**
 * True when the interaction came from the configured server.
 *
 * Commands are registered per guild by default, so this rarely fires. It
 * matters when they are registered globally: without it, Manage Server in any
 * server the bot has joined would grant write access to the website's data.
 *
 * @param {{ guildId?: string | null }} interaction
 * @param {{ discordGuildId?: string }} [config]
 * @returns {boolean}
 */
export function isConfiguredGuild(interaction, config) {
  if (!config?.discordGuildId) return true;
  return interaction.guildId === config.discordGuildId;
}

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
 * @param {{ discordGuildId?: string }} [config]
 * @returns {Promise<boolean>} true when the command may continue
 */
export async function ensureAllowed(interaction, config) {
  const wrongGuild = !isConfiguredGuild(interaction, config);
  if (!wrongGuild && isAllowed(interaction)) return true;

  log.warn('Refused a command', {
    user: interaction.user?.tag ?? interaction.user?.username,
    userId: interaction.user?.id,
    command: interaction.commandName,
    guild: interaction.guildId,
    reason: wrongGuild ? 'wrong server' : 'missing Manage Server',
  });

  const embed = wrongGuild
    ? errorEmbed({
        title: 'Not allowed',
        message: WRONG_GUILD_TEXT,
        details: ['Run the command in the server the bot was set up for.'],
      })
    : errorEmbed({
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
