/**
 * commands/event.js
 *
 * /event add | edit | remove | list
 *
 * Manages src/data/events.json, the calendar behind the "Next race" strip and
 * the countdown on the website.
 */

import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { NOTE_MAX, STATUS_VALUES, isClearToken } from '../lib/schema.js';
import { makeId, idSet } from '../lib/ids.js';
import { BotError } from '../lib/errors.js';
import {
  checkDateRange,
  parseClassList,
  parseDate,
  parseRequiredText,
  parseText,
  trimOption,
} from '../lib/options.js';
import { handleIdAutocomplete, handleList, handleRemove, writeChange } from './shared.js';

const STATUS_CHOICES = STATUS_VALUES.map((value) => ({ name: value, value }));

export const data = new SlashCommandBuilder()
  .setName('event')
  .setDescription('Add, edit, remove or list calendar events on the website')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add a calendar event')
      .addStringOption((option) =>
        option.setName('name').setDescription('Event name, for example Petit Le Mans').setRequired(true).setMaxLength(80),
      )
      .addStringOption((option) =>
        option.setName('track').setDescription('Track name as it should read on the site').setRequired(true).setMaxLength(80),
      )
      .addStringOption((option) =>
        option.setName('start').setDescription('First day, YYYY-MM-DD').setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName('classes')
          // Discord allows 100 characters in an option description, so the full
          // list of classes lives in SPEC.md rather than here.
          .setDescription('One to four classes, separated by commas, for example GTP, LMP2, GT3')
          .setRequired(true),
      )
      .addStringOption((option) =>
        option.setName('status').setDescription('Where the entry stands').setRequired(true).addChoices(...STATUS_CHOICES),
      )
      .addStringOption((option) =>
        option.setName('end').setDescription('Last day, YYYY-MM-DD. Leave empty for a one day event'),
      )
      .addStringOption((option) =>
        option.setName('note').setDescription(`One short line, up to ${NOTE_MAX} characters`).setMaxLength(NOTE_MAX),
      )
      .addStringOption((option) =>
        option.setName('id').setDescription('Custom id. Leave empty to build one from the start date and name').setMaxLength(80),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('edit')
      .setDescription('Change fields of an existing event')
      .addStringOption((option) =>
        option.setName('id').setDescription('The event to change').setRequired(true).setAutocomplete(true),
      )
      .addStringOption((option) => option.setName('name').setDescription('New event name').setMaxLength(80))
      .addStringOption((option) => option.setName('track').setDescription('New track name').setMaxLength(80))
      .addStringOption((option) => option.setName('start').setDescription('New first day, YYYY-MM-DD'))
      .addStringOption((option) =>
        option.setName('end').setDescription('New last day, YYYY-MM-DD. Use a single hyphen to clear it'),
      )
      .addStringOption((option) =>
        option.setName('classes').setDescription('Replacement class list, separated by commas'),
      )
      .addStringOption((option) => option.setName('status').setDescription('New status').addChoices(...STATUS_CHOICES))
      .addStringOption((option) =>
        option.setName('note').setDescription('New note. Use a single hyphen to clear it').setMaxLength(NOTE_MAX),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Remove an event after a confirmation')
      .addStringOption((option) =>
        option.setName('id').setDescription('The event to remove').setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('List events, ten to a page, earliest first')
      .addIntegerOption((option) => option.setName('page').setDescription('Page number, from 1').setMinValue(1)),
  );

/**
 * One line label for an event in the id suggestions.
 * @param {Record<string, any>} record
 * @returns {string}
 */
function describeEvent(record) {
  const placeholder = record._placeholder === true ? ' (placeholder)' : '';
  return `${record.start ?? '????-??-??'} ${record.name ?? record.id ?? ''} - ${record.status ?? ''}${placeholder}`.trim();
}

/**
 * Build a new event record from the add options.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Record<string, any>} the record without its id
 */
function draftFromOptions(interaction) {
  const start = parseDate(interaction.options.getString('start'), { field: 'start' });
  const record = {
    name: parseRequiredText(interaction.options.getString('name'), 'name', 2, 80),
    track: parseRequiredText(interaction.options.getString('track'), 'track', 2, 80),
    start,
    classes: parseClassList(interaction.options.getString('classes')),
    status: interaction.options.getString('status'),
  };

  const end = trimOption(interaction.options.getString('end'));
  if (end !== undefined) {
    record.end = checkDateRange(start, parseDate(end, { field: 'end' }));
  }

  const note = trimOption(interaction.options.getString('note'));
  if (note !== undefined) record.note = parseText(note, 'note', NOTE_MAX);

  return record;
}

/**
 * Apply the supplied edit options to a copy of an existing record.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {Record<string, any>} record
 * @returns {{ record: Record<string, any>, changed: string[] }}
 */
function applyEdits(interaction, record) {
  const next = structuredClone(record);
  const changed = [];

  for (const [field, min, max] of [
    ['name', 2, 80],
    ['track', 2, 80],
  ]) {
    const value = trimOption(interaction.options.getString(field));
    if (value !== undefined) {
      next[field] = parseRequiredText(value, field, min, max);
      changed.push(field);
    }
  }

  const start = trimOption(interaction.options.getString('start'));
  if (start !== undefined) {
    next.start = parseDate(start, { field: 'start' });
    changed.push('start');
  }

  const end = interaction.options.getString('end');
  if (end !== null && end !== undefined) {
    if (isClearToken(end)) {
      delete next.end;
      changed.push('end cleared');
    } else {
      next.end = parseDate(end, { field: 'end' });
      changed.push('end');
    }
  }

  // Whichever of the two dates changed, the pair still has to make sense.
  if (next.end) checkDateRange(next.start, next.end);

  const classes = trimOption(interaction.options.getString('classes'));
  if (classes !== undefined) {
    next.classes = parseClassList(classes);
    changed.push('classes');
  }

  const status = interaction.options.getString('status');
  if (status) {
    next.status = status;
    changed.push('status');
  }

  const note = interaction.options.getString('note');
  if (note !== null && note !== undefined) {
    if (isClearToken(note)) {
      delete next.note;
      changed.push('note cleared');
    } else {
      next.note = parseText(note, 'note', NOTE_MAX);
      changed.push('note');
    }
  }

  return { record: next, changed };
}

/**
 * Route one /event command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: object, client: import('discord.js').Client }} ctx
 * @returns {Promise<void>}
 */
export async function execute(interaction, ctx) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'list') return handleList(interaction, ctx, 'events');
  if (sub === 'remove') return handleRemove(interaction, ctx, 'events');

  if (sub === 'add') {
    const draft = draftFromOptions(interaction);
    const explicitId = trimOption(interaction.options.getString('id'));
    return writeChange(
      interaction,
      ctx,
      'events',
      (records) => {
        const id = makeId('events', draft, idSet(records), explicitId);
        const record = { id, ...draft };
        records.push(record);
        return { records, record, action: 'add', id };
      },
      { title: 'Event added', summary: 'The event was written to events.json.' },
    );
  }

  if (sub === 'edit') {
    const id = String(interaction.options.getString('id') ?? '').trim();
    return writeChange(
      interaction,
      ctx,
      'events',
      (records) => {
        const index = records.findIndex((entry) => entry?.id === id);
        if (index === -1) {
          throw new BotError(`No event with id "${id}" exists.`, {
            title: 'Record not found',
            details: ['Use the id suggestions, or run /event list to see the ids.'],
          });
        }
        const { record, changed } = applyEdits(interaction, records[index]);
        if (changed.length === 0) {
          throw new BotError('No fields were supplied, so there was nothing to change.', {
            title: 'Nothing to do',
            details: ['Add at least one option, for example status or end.'],
          });
        }
        records[index] = record;
        return { records, record, action: 'edit', id, changed };
      },
      {
        title: 'Event updated',
        summary: (outcome) => `Updated in events.json. Fields changed: ${outcome.changed.join(', ')}.`,
      },
    );
  }

  throw new BotError(`Unknown subcommand: ${sub}`, { title: 'Unknown subcommand' });
}

/**
 * Fill in the id option.
 * @param {import('discord.js').AutocompleteInteraction} interaction
 * @param {{ storage: object }} ctx
 * @returns {Promise<void>}
 */
export async function autocomplete(interaction, ctx) {
  return handleIdAutocomplete(interaction, ctx, 'events', describeEvent);
}
