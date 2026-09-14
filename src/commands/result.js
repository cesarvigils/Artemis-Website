/**
 * commands/result.js
 *
 * /result add | edit | remove | list
 *
 * Manages src/data/results.json, the race results the website shows on the home
 * page ("Recent results", the hero proof row) and on the partners page.
 *
 * Only members with Manage Server may use it: the permission is set on the
 * command here, and checked again at run time in src/index.js.
 */

import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { CLASS_VALUES, ENTRIES_MAX, ENTRIES_MIN, NOTE_MAX, isClearToken } from '../lib/schema.js';
import { makeId, idSet } from '../lib/ids.js';
import { BotError } from '../lib/errors.js';
import {
  parseDate,
  parseEntries,
  parseNameList,
  parsePosition,
  parseRequiredText,
  parseText,
  trimOption,
} from '../lib/options.js';
import { handleIdAutocomplete, handleList, handleRemove, writeChange } from './shared.js';

/** Choice list for the class option, built from the contract. */
const CLASS_CHOICES = CLASS_VALUES.map((value) => ({ name: value, value }));

/** Optional fields the clear option can empty. */
const CLEARABLE = ['note', 'entries'];

export const data = new SlashCommandBuilder()
  .setName('result')
  .setDescription('Add, edit, remove or list race results on the website')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add a race result')
      .addStringOption((option) =>
        option.setName('date').setDescription('Race date, YYYY-MM-DD, for example 2026-09-06').setRequired(true),
      )
      .addStringOption((option) =>
        option.setName('event').setDescription('Event name, for example Suzuka 1000').setRequired(true).setMaxLength(80),
      )
      .addStringOption((option) =>
        option.setName('track').setDescription('Track name as it should read on the site').setRequired(true).setMaxLength(80),
      )
      .addStringOption((option) =>
        option
          .setName('series')
          .setDescription('League or series, for example iRacing Special Event')
          .setRequired(true)
          .setMaxLength(60),
      )
      .addStringOption((option) =>
        option.setName('class').setDescription('Car class').setRequired(true).addChoices(...CLASS_CHOICES),
      )
      .addIntegerOption((option) =>
        option
          .setName('position')
          .setDescription('Finishing position, 1 to 99')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(99),
      )
      .addStringOption((option) =>
        option
          .setName('drivers')
          .setDescription('Driver names in order, separated by commas, 1 to 6')
          .setRequired(true),
      )
      .addIntegerOption((option) =>
        option
          .setName('entries')
          .setDescription('Cars in the class or split, so the site can show P4 / 41')
          .setMinValue(ENTRIES_MIN)
          .setMaxValue(ENTRIES_MAX),
      )
      .addStringOption((option) =>
        option.setName('note').setDescription(`One short line about the race, up to ${NOTE_MAX} characters`).setMaxLength(NOTE_MAX),
      )
      .addStringOption((option) =>
        option.setName('id').setDescription('Custom id. Leave empty to build one from the date, event and class').setMaxLength(80),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('edit')
      .setDescription('Change fields of an existing result')
      .addStringOption((option) =>
        option.setName('id').setDescription('The result to change').setRequired(true).setAutocomplete(true),
      )
      .addStringOption((option) => option.setName('date').setDescription('New race date, YYYY-MM-DD'))
      .addStringOption((option) => option.setName('event').setDescription('New event name').setMaxLength(80))
      .addStringOption((option) => option.setName('track').setDescription('New track name').setMaxLength(80))
      .addStringOption((option) => option.setName('series').setDescription('New league or series').setMaxLength(60))
      .addStringOption((option) => option.setName('class').setDescription('New car class').addChoices(...CLASS_CHOICES))
      .addIntegerOption((option) =>
        option.setName('position').setDescription('New finishing position, 1 to 99').setMinValue(1).setMaxValue(99),
      )
      .addStringOption((option) =>
        option.setName('drivers').setDescription('Replacement driver list, separated by commas'),
      )
      .addIntegerOption((option) =>
        option
          .setName('entries')
          .setDescription('New field size, the number of cars in the class or split')
          .setMinValue(ENTRIES_MIN)
          .setMaxValue(ENTRIES_MAX),
      )
      .addStringOption((option) =>
        option.setName('note').setDescription('New note. Use a single hyphen to clear it').setMaxLength(NOTE_MAX),
      )
      .addStringOption((option) =>
        option
          .setName('clear')
          .setDescription('Empty one optional field')
          .addChoices(...CLEARABLE.map((value) => ({ name: value, value }))),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Remove a result after a confirmation')
      .addStringOption((option) =>
        option.setName('id').setDescription('The result to remove').setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('List results, ten to a page, newest first')
      .addIntegerOption((option) => option.setName('page').setDescription('Page number, from 1').setMinValue(1)),
  );

/**
 * One line label for a result in the id suggestions.
 * @param {Record<string, any>} record
 * @returns {string}
 */
function describeResult(record) {
  const placeholder = record._placeholder === true ? ' (placeholder)' : '';
  return `${record.date ?? '????-??-??'} P${record.position ?? '?'} ${record.class ?? ''} ${record.event ?? record.id ?? ''}${placeholder}`.trim();
}

/**
 * Build a new result record from the add options.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Record<string, any>} the record without its id
 */
function draftFromOptions(interaction) {
  const record = {
    date: parseDate(interaction.options.getString('date'), { field: 'date', maxFuture: true }),
    event: parseRequiredText(interaction.options.getString('event'), 'event', 2, 80),
    track: parseRequiredText(interaction.options.getString('track'), 'track', 2, 80),
    series: parseRequiredText(interaction.options.getString('series'), 'series', 2, 60),
    class: interaction.options.getString('class'),
    position: parsePosition(interaction.options.getInteger('position')),
    drivers: parseNameList(interaction.options.getString('drivers'), { field: 'drivers' }),
  };
  const entries = interaction.options.getInteger('entries');
  if (entries !== null && entries !== undefined) record.entries = parseEntries(entries, record.position);

  const note = trimOption(interaction.options.getString('note'));
  if (note) record.note = parseText(note, 'note', NOTE_MAX);
  return record;
}

/**
 * Apply the supplied edit options to a copy of an existing record.
 * Only options that were actually sent are changed.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {Record<string, any>} record
 * @returns {{ record: Record<string, any>, changed: string[] }}
 */
function applyEdits(interaction, record) {
  const next = { ...record };
  const changed = [];

  const date = trimOption(interaction.options.getString('date'));
  if (date !== undefined) {
    next.date = parseDate(date, { field: 'date', maxFuture: true });
    changed.push('date');
  }

  for (const [field, min, max] of [
    ['event', 2, 80],
    ['track', 2, 80],
    ['series', 2, 60],
  ]) {
    const value = trimOption(interaction.options.getString(field));
    if (value !== undefined) {
      next[field] = parseRequiredText(value, field, min, max);
      changed.push(field);
    }
  }

  const carClass = interaction.options.getString('class');
  if (carClass) {
    next.class = carClass;
    changed.push('class');
  }

  const position = interaction.options.getInteger('position');
  if (position !== null && position !== undefined) {
    next.position = parsePosition(position);
    changed.push('position');
  }

  const drivers = trimOption(interaction.options.getString('drivers'));
  if (drivers !== undefined) {
    next.drivers = parseNameList(drivers, { field: 'drivers' });
    changed.push('drivers');
  }

  const entries = interaction.options.getInteger('entries');
  if (entries !== null && entries !== undefined) {
    // Checked against the position the record will end up with, edited or not.
    next.entries = parseEntries(entries, next.position);
    changed.push('entries');
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

  const clear = interaction.options.getString('clear');
  if (clear) {
    delete next[clear];
    changed.push(`${clear} cleared`);
  }

  // Editing the position alone can also break the pair, so check it once more.
  if (next.entries !== undefined) parseEntries(next.entries, next.position);

  return { record: next, changed };
}

/**
 * Route one /result command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: object, client: import('discord.js').Client }} ctx
 * @returns {Promise<void>}
 */
export async function execute(interaction, ctx) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'list') return handleList(interaction, ctx, 'results');
  if (sub === 'remove') return handleRemove(interaction, ctx, 'results');

  if (sub === 'add') {
    const draft = draftFromOptions(interaction);
    const explicitId = trimOption(interaction.options.getString('id'));
    return writeChange(
      interaction,
      ctx,
      'results',
      (records) => {
        const id = makeId('results', draft, idSet(records), explicitId);
        const record = { id, ...draft };
        records.push(record);
        return { records, record, action: 'add', id };
      },
      { title: 'Result added', summary: 'The result was written to results.json.' },
    );
  }

  if (sub === 'edit') {
    const id = String(interaction.options.getString('id') ?? '').trim();
    return writeChange(
      interaction,
      ctx,
      'results',
      (records) => {
        const index = records.findIndex((entry) => entry?.id === id);
        if (index === -1) {
          throw new BotError(`No result with id "${id}" exists.`, {
            title: 'Record not found',
            details: ['Use the id suggestions, or run /result list to see the ids.'],
          });
        }
        const { record, changed } = applyEdits(interaction, records[index]);
        if (changed.length === 0) {
          throw new BotError('No fields were supplied, so there was nothing to change.', {
            title: 'Nothing to do',
            details: ['Add at least one option, for example position or note.'],
          });
        }
        records[index] = record;
        return { records, record, action: 'edit', id, changed };
      },
      {
        title: 'Result updated',
        summary: (outcome) => `Updated in results.json. Fields changed: ${outcome.changed.join(', ')}.`,
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
  return handleIdAutocomplete(interaction, ctx, 'results', describeResult);
}
