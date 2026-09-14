/**
 * commands/shared.js
 *
 * Plumbing that every command module reuses: the ephemeral reply helpers, the
 * generic list page, the id autocomplete, and the Confirm / Cancel prompt used
 * before a record is removed.
 *
 * A command module only has to describe its own options and build its record.
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import { errorEmbed, infoEmbed, listEmbed, recordEmbed, successEmbed, liveNote, truncate } from '../lib/embeds.js';
import { applyChange, readRecords, readForAutocomplete, clearAutocompleteCache } from '../lib/storage.js';
import { sortRecords } from '../lib/serialize.js';
import { validateArray } from '../lib/validate.js';
import { BotError, isBotError } from '../lib/errors.js';
import { parsePage } from '../lib/options.js';
import { postAudit } from '../lib/audit.js';
import { FILES, SINGULAR } from '../lib/schema.js';
import { log } from '../lib/log.js';

/** Records shown on one page of a list. */
export const PAGE_SIZE = 10;

/** How long the Confirm / Cancel prompt stays usable. */
export const CONFIRM_TIMEOUT_MS = 60000;

/**
 * The Discord user who ran the command, in the shape the commit message wants.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {{ username: string, id: string }}
 */
export function actorOf(interaction) {
  return {
    username: interaction.user?.username ?? 'unknown',
    id: interaction.user?.id ?? '0',
  };
}

/**
 * Send an ephemeral reply, whether or not the interaction was deferred.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {import('discord.js').InteractionReplyOptions} payload
 * @returns {Promise<void>}
 */
export async function replyEphemeral(interaction, payload) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ ...payload, components: payload.components ?? [] });
    return;
  }
  await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
}

/**
 * Show an error. Known problems are shown as written; anything else is reported
 * as an internal error and the stack goes to the log.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {unknown} error
 * @returns {Promise<void>}
 */
export async function replyError(interaction, error) {
  const embed = isBotError(error)
    ? errorEmbed({ title: error.title, message: error.message, details: error.details })
    : errorEmbed({
        title: 'Something went wrong',
        message: 'The command could not be finished. The details were written to the bot log.',
        details: [truncate(String(error?.message ?? error), 300)],
      });

  if (!isBotError(error)) log.error(`Command ${interaction.commandName} failed`, error);
  else log.warn(`Command ${interaction.commandName} refused`, error.message);

  try {
    await replyEphemeral(interaction, { embeds: [embed] });
  } catch (replyFailure) {
    log.error('Could not deliver the error reply', replyFailure);
  }
}

/**
 * Read a file for display. Invalid records are not hidden: the list still shows
 * them, with a note telling the operator to run /data validate.
 *
 * @param {object} storage
 * @param {'results'|'drivers'|'events'} kind
 * @returns {Promise<{ records: Array<Record<string, any>>, invalid: number }>}
 */
async function readForDisplay(storage, kind) {
  const { records } = await readRecords(storage, kind, { validate: false });
  const { errors } = validateArray(kind, records);
  return { records, invalid: errors.length };
}

/**
 * The shared /<kind> list subcommand.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: import('../lib/config.js').BotConfig }} ctx
 * @param {'results'|'drivers'|'events'} kind
 * @returns {Promise<void>}
 */
export async function handleList(interaction, ctx, kind) {
  const page = parsePage(interaction.options.getInteger('page'));
  const { records, invalid } = await readForDisplay(ctx.storage, kind);
  const sorted = sortRecords(kind, records);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  if (page > pages) {
    throw new BotError(`There are only ${pages} page(s) in ${FILES[kind]}.`, { title: 'No such page' });
  }

  const offset = (page - 1) * PAGE_SIZE;
  const embed = listEmbed(kind, sorted.slice(offset, offset + PAGE_SIZE), {
    page,
    pages,
    total: sorted.length,
    offset,
    source: ctx.storage.describe(),
  });

  if (invalid > 0) {
    embed.addFields({
      name: 'Warning',
      value: `${invalid} problem(s) found in this file. Run /data validate for the list.`,
    });
  }

  await replyEphemeral(interaction, { embeds: [embed] });
}

/**
 * Fill in the id option of edit and remove.
 *
 * Discord allows three seconds and at most 25 choices, so the file is read
 * through the short lived autocomplete cache and the list is cut to 25.
 *
 * @param {import('discord.js').AutocompleteInteraction} interaction
 * @param {{ storage: object }} ctx
 * @param {'results'|'drivers'|'events'} kind
 * @param {(record: Record<string, any>) => string} describe one line label
 * @returns {Promise<void>}
 */
export async function handleIdAutocomplete(interaction, ctx, kind, describe) {
  const focused = String(interaction.options.getFocused() ?? '').toLowerCase();
  const records = await readForAutocomplete(ctx.storage, kind);
  const sorted = sortRecords(kind, records);

  const choices = sorted
    .filter((record) => {
      if (!focused) return true;
      const haystack = `${record.id ?? ''} ${describe(record)}`.toLowerCase();
      return haystack.includes(focused);
    })
    .slice(0, 25)
    .map((record) => ({
      // Discord limits a choice name to 100 characters and a value to 100 too.
      name: truncate(describe(record), 100),
      value: truncate(String(record.id ?? ''), 100),
    }))
    .filter((choice) => choice.value.length > 0);

  await interaction.respond(choices);
}

/**
 * Write one change and reply with the standard confirmation.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: import('../lib/config.js').BotConfig, client: import('discord.js').Client }} ctx
 * @param {'results'|'drivers'|'events'} kind
 * @param {(records: Array<Record<string, any>>) => { records: Array<Record<string, any>>, record: Record<string, any>, action: 'add'|'edit'|'remove', id: string }} mutate
 * @param {{
 *   title: string,
 *   summary?: string | ((outcome: { changed: string[], id: string, total: number }) => string),
 *   respond?: (payload: object) => Promise<unknown>
 * }} options summary may be a function when the wording depends on what changed
 * @returns {Promise<void>}
 */
export async function writeChange(interaction, ctx, kind, mutate, options) {
  const actor = actorOf(interaction);
  const outcome = await applyChange(ctx.storage, kind, mutate, { actor });

  // The file changed, so the autocomplete cache is stale.
  clearAutocompleteCache();

  // The summary may depend on what the change turned out to be.
  const summary = typeof options.summary === 'function' ? options.summary(outcome) : options.summary;

  const extraFields = [
    { name: 'File', value: `${FILES[kind]} (${outcome.total} record(s))`, inline: true },
    {
      name: 'Commit',
      value: outcome.commit.shortSha ? outcome.commit.shortSha : 'local write, no commit',
      inline: true,
    },
  ];

  const embed =
    outcome.action === 'remove'
      ? successEmbed({
          title: options.title,
          description: `${summary ?? ''}\n${liveNote(ctx.storage.mode)}`.trim(),
          fields: extraFields,
        })
      : recordEmbed(kind, outcome.record, {
          title: options.title,
          description: `${summary ?? ''}\n${liveNote(ctx.storage.mode)}`.trim(),
          extraFields,
        });

  const respond = options.respond ?? ((payload) => replyEphemeral(interaction, payload));
  await respond({ embeds: [embed], components: [] });

  await postAudit(ctx.client, ctx.config, {
    action: outcome.action,
    kind,
    id: outcome.id,
    summary,
    commit: outcome.commit,
    actor,
  });
}

/**
 * The shared /<kind> remove subcommand: show the record, ask for confirmation
 * with a button pair, then write the change.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: import('../lib/config.js').BotConfig, client: import('discord.js').Client }} ctx
 * @param {'results'|'drivers'|'events'} kind
 * @returns {Promise<void>}
 */
export async function handleRemove(interaction, ctx, kind) {
  const id = String(interaction.options.getString('id') ?? '').trim();
  if (!id) throw new BotError('An id is required to remove a record.', { title: 'Missing id' });

  const { records } = await readRecords(ctx.storage, kind);
  const record = records.find((entry) => entry?.id === id);
  if (!record) {
    throw new BotError(`No record with id "${id}" exists in ${FILES[kind]}.`, {
      title: 'Record not found',
      details: ['Use the id suggestions, or run the list subcommand to see the ids.'],
    });
  }

  const nonce = interaction.id;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`confirm-${nonce}`).setLabel('Confirm').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`cancel-${nonce}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary),
  );

  const prompt = recordEmbed(kind, record, {
    title: `Remove this ${SINGULAR[kind]}`,
    description: 'This cannot be undone from Discord. Choose Confirm to write the change, or Cancel to stop.',
  });

  const message = await interaction.editReply({ embeds: [prompt], components: [row] });

  let press;
  try {
    press = await message.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: CONFIRM_TIMEOUT_MS,
      filter: (component) => component.user.id === interaction.user.id,
    });
  } catch {
    // awaitMessageComponent rejects when the time runs out.
    await interaction.editReply({
      embeds: [
        infoEmbed({
          title: 'Confirmation expired',
          description: 'Nothing was changed. Run the command again if you still want to remove the record.',
        }),
      ],
      components: [],
    });
    return;
  }

  if (press.customId.startsWith('cancel-')) {
    await press.update({
      embeds: [infoEmbed({ title: 'Cancelled', description: 'Nothing was changed.' })],
      components: [],
    });
    return;
  }

  // Acknowledge the button press first: Discord expects an answer within three
  // seconds, and the write can take longer than that.
  await press.update({
    embeds: [infoEmbed({ title: 'Working', description: 'Writing the change.' })],
    components: [],
  });

  await writeChange(
    interaction,
    ctx,
    kind,
    (current) => {
      const index = current.findIndex((entry) => entry?.id === id);
      if (index === -1) {
        throw new BotError(`The record "${id}" was already removed by someone else.`, {
          title: 'Record not found',
        });
      }
      const [removed] = current.splice(index, 1);
      return { records: current, record: removed, action: 'remove', id };
    },
    {
      title: `Removed a ${SINGULAR[kind]}`,
      summary: `Record "${id}" was removed from ${FILES[kind]}.`,
      respond: (payload) => interaction.editReply(payload),
    },
  );
}
