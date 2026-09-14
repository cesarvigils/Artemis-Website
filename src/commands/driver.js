/**
 * commands/driver.js
 *
 * /driver add | edit | remove | list
 *
 * Manages src/data/drivers.json, the roster the website shows in "Who drives"
 * on the home page and on the team page.
 *
 * Two ways to empty an optional field on edit:
 *  - send a single hyphen as the value of a text option (bio, licence, links)
 *  - use the clear option, which also handles the iRating number
 */

import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { BIO_MAX, GROUP_VALUES, ROLE_VALUES, SOCIAL_KEYS, isClearToken } from '../lib/schema.js';
import { makeId, idSet } from '../lib/ids.js';
import { BotError } from '../lib/errors.js';
import {
  parseCountry,
  parseDriverNumber,
  parseIrating,
  parseLicence,
  parseRequiredText,
  parseSocialUrl,
  parseText,
  trimOption,
} from '../lib/options.js';
import { handleIdAutocomplete, handleList, handleRemove, writeChange } from './shared.js';

const ROLE_CHOICES = ROLE_VALUES.map((value) => ({ name: value, value }));
const GROUP_CHOICES = GROUP_VALUES.map((value) => ({ name: value, value }));

/** Fields the clear option can empty. */
const CLEARABLE = ['bio', 'number', 'irating', 'licence', ...SOCIAL_KEYS];

export const data = new SlashCommandBuilder()
  .setName('driver')
  .setDescription('Add, edit, remove or list drivers and crew on the website')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Add a driver or crew member')
      .addStringOption((option) =>
        option.setName('name').setDescription('Name or handle shown on the site').setRequired(true).setMaxLength(40),
      )
      .addStringOption((option) =>
        option.setName('role').setDescription('What they do').setRequired(true).addChoices(...ROLE_CHOICES),
      )
      .addStringOption((option) =>
        option
          .setName('group')
          .setDescription('Where they appear on the team page. Use crew for pitwall and staff')
          .setRequired(true)
          .addChoices(...GROUP_CHOICES),
      )
      .addStringOption((option) =>
        option.setName('country').setDescription('Three letter country code, for example USA').setRequired(true).setMaxLength(3),
      )
      .addStringOption((option) =>
        option
          .setName('focus')
          .setDescription('Short speciality, for example GT3 / Endurance or Strategy')
          .setRequired(true)
          .setMaxLength(40),
      )
      .addStringOption((option) =>
        option.setName('number').setDescription('Car number, 1 to 3 digits. Leave empty for crew').setMaxLength(4),
      )
      .addStringOption((option) =>
        option.setName('bio').setDescription(`One line, up to ${BIO_MAX} characters`).setMaxLength(BIO_MAX),
      )
      .addIntegerOption((option) =>
        option.setName('irating').setDescription('iRating, 0 to 15000').setMinValue(0).setMaxValue(15000),
      )
      .addStringOption((option) => option.setName('licence').setDescription('Licence, for example A 4.20').setMaxLength(10))
      .addStringOption((option) => option.setName('x').setDescription('Link to their X profile, https'))
      .addStringOption((option) => option.setName('twitch').setDescription('Link to their Twitch channel, https'))
      .addStringOption((option) => option.setName('youtube').setDescription('Link to their YouTube channel, https'))
      .addStringOption((option) => option.setName('instagram').setDescription('Link to their Instagram profile, https'))
      .addBooleanOption((option) =>
        option.setName('active').setDescription('Show on the site. Defaults to yes'),
      )
      .addStringOption((option) =>
        option.setName('id').setDescription('Custom id. Leave empty to build one from the name').setMaxLength(80),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('edit')
      .setDescription('Change fields of an existing driver or crew member')
      .addStringOption((option) =>
        option.setName('id').setDescription('The person to change').setRequired(true).setAutocomplete(true),
      )
      .addStringOption((option) => option.setName('name').setDescription('New name').setMaxLength(40))
      .addStringOption((option) => option.setName('role').setDescription('New role').addChoices(...ROLE_CHOICES))
      .addStringOption((option) => option.setName('group').setDescription('New group').addChoices(...GROUP_CHOICES))
      .addStringOption((option) => option.setName('country').setDescription('New country code').setMaxLength(3))
      .addStringOption((option) => option.setName('focus').setDescription('New speciality').setMaxLength(40))
      .addStringOption((option) => option.setName('number').setDescription('New car number').setMaxLength(4))
      .addStringOption((option) =>
        option.setName('bio').setDescription('New bio. Use a single hyphen to clear it').setMaxLength(BIO_MAX),
      )
      .addIntegerOption((option) =>
        option.setName('irating').setDescription('New iRating').setMinValue(0).setMaxValue(15000),
      )
      .addStringOption((option) =>
        option.setName('licence').setDescription('New licence. Use a single hyphen to clear it').setMaxLength(10),
      )
      .addStringOption((option) => option.setName('x').setDescription('New X link, or a single hyphen to clear it'))
      .addStringOption((option) => option.setName('twitch').setDescription('New Twitch link, or a single hyphen to clear it'))
      .addStringOption((option) => option.setName('youtube').setDescription('New YouTube link, or a single hyphen to clear it'))
      .addStringOption((option) =>
        option.setName('instagram').setDescription('New Instagram link, or a single hyphen to clear it'),
      )
      .addBooleanOption((option) => option.setName('active').setDescription('Show on the site'))
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
      .setDescription('Remove a driver or crew member after a confirmation')
      .addStringOption((option) =>
        option.setName('id').setDescription('The person to remove').setRequired(true).setAutocomplete(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName('list')
      .setDescription('List drivers and crew, ten to a page')
      .addIntegerOption((option) => option.setName('page').setDescription('Page number, from 1').setMinValue(1)),
  );

/**
 * One line label for a driver in the id suggestions.
 * @param {Record<string, any>} record
 * @returns {string}
 */
function describeDriver(record) {
  const number = String(record.number ?? '').length ? ` no ${record.number}` : '';
  const placeholder = record._placeholder === true ? ' (placeholder)' : '';
  return `${record.name ?? record.id ?? ''}${number} - ${record.group ?? ''} ${record.role ?? ''}${placeholder}`.trim();
}

/**
 * Read the social link options into an object, keeping only the links supplied.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Record<string, string>}
 */
function socialsFromOptions(interaction) {
  const socials = {};
  for (const key of SOCIAL_KEYS) {
    const value = trimOption(interaction.options.getString(key));
    if (value !== undefined) socials[key] = parseSocialUrl(value, key);
  }
  return socials;
}

/**
 * Build a new driver record from the add options.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns {Record<string, any>} the record without its id
 */
function draftFromOptions(interaction) {
  const group = interaction.options.getString('group');
  const numberRaw = trimOption(interaction.options.getString('number'));
  const number = numberRaw === undefined ? '' : parseDriverNumber(numberRaw);

  if (group !== 'crew' && number === '') {
    throw new BotError('A car number is required for road and oval drivers.', {
      title: 'Missing number',
      details: ['Add the number option, or use the crew group for pitwall and staff.'],
    });
  }

  const record = {
    name: parseRequiredText(interaction.options.getString('name'), 'name', 2, 40),
    role: interaction.options.getString('role'),
    group,
    number,
    country: parseCountry(interaction.options.getString('country')),
    focus: parseRequiredText(interaction.options.getString('focus'), 'focus', 2, 40),
  };

  const bio = trimOption(interaction.options.getString('bio'));
  if (bio !== undefined) record.bio = parseText(bio, 'bio', BIO_MAX);

  const stats = {};
  const irating = interaction.options.getInteger('irating');
  if (irating !== null && irating !== undefined) stats.irating = parseIrating(irating);
  const licence = trimOption(interaction.options.getString('licence'));
  if (licence !== undefined) stats.licence = parseLicence(licence);
  if (Object.keys(stats).length > 0) record.stats = stats;

  const socials = socialsFromOptions(interaction);
  if (Object.keys(socials).length > 0) record.socials = socials;

  const active = interaction.options.getBoolean('active');
  record.active = active === null || active === undefined ? true : active;

  return record;
}

/**
 * Remove one optional field, named by the clear option.
 * @param {Record<string, any>} record modified in place
 * @param {string} field
 */
function clearField(record, field) {
  if (field === 'bio') {
    delete record.bio;
    return;
  }
  if (field === 'number') {
    record.number = '';
    return;
  }
  if (field === 'irating' || field === 'licence') {
    if (record.stats) {
      delete record.stats[field];
      if (Object.keys(record.stats).length === 0) delete record.stats;
    }
    return;
  }
  if (record.socials) {
    delete record.socials[field];
    if (Object.keys(record.socials).length === 0) delete record.socials;
  }
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

  const name = trimOption(interaction.options.getString('name'));
  if (name !== undefined) {
    next.name = parseRequiredText(name, 'name', 2, 40);
    changed.push('name');
  }

  for (const field of ['role', 'group']) {
    const value = interaction.options.getString(field);
    if (value) {
      next[field] = value;
      changed.push(field);
    }
  }

  const country = trimOption(interaction.options.getString('country'));
  if (country !== undefined) {
    next.country = parseCountry(country);
    changed.push('country');
  }

  const focus = trimOption(interaction.options.getString('focus'));
  if (focus !== undefined) {
    next.focus = parseRequiredText(focus, 'focus', 2, 40);
    changed.push('focus');
  }

  const number = interaction.options.getString('number');
  if (number !== null && number !== undefined) {
    next.number = isClearToken(number) ? '' : parseDriverNumber(number);
    changed.push('number');
  }

  const bio = interaction.options.getString('bio');
  if (bio !== null && bio !== undefined) {
    if (isClearToken(bio)) {
      delete next.bio;
      changed.push('bio cleared');
    } else {
      next.bio = parseText(bio, 'bio', BIO_MAX);
      changed.push('bio');
    }
  }

  const irating = interaction.options.getInteger('irating');
  if (irating !== null && irating !== undefined) {
    next.stats = { ...(next.stats ?? {}), irating: parseIrating(irating) };
    changed.push('irating');
  }

  const licence = interaction.options.getString('licence');
  if (licence !== null && licence !== undefined) {
    if (isClearToken(licence)) {
      clearField(next, 'licence');
      changed.push('licence cleared');
    } else {
      next.stats = { ...(next.stats ?? {}), licence: parseLicence(licence) };
      changed.push('licence');
    }
  }

  for (const key of SOCIAL_KEYS) {
    const value = interaction.options.getString(key);
    if (value === null || value === undefined) continue;
    if (isClearToken(value)) {
      clearField(next, key);
      changed.push(`${key} cleared`);
    } else {
      next.socials = { ...(next.socials ?? {}), [key]: parseSocialUrl(value, key) };
      changed.push(key);
    }
  }

  const active = interaction.options.getBoolean('active');
  if (active !== null && active !== undefined) {
    next.active = active;
    changed.push('active');
  }

  const clear = interaction.options.getString('clear');
  if (clear) {
    clearField(next, clear);
    changed.push(`${clear} cleared`);
  }

  return { record: next, changed };
}

/**
 * Route one /driver command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ storage: object, config: object, client: import('discord.js').Client }} ctx
 * @returns {Promise<void>}
 */
export async function execute(interaction, ctx) {
  const sub = interaction.options.getSubcommand();

  if (sub === 'list') return handleList(interaction, ctx, 'drivers');
  if (sub === 'remove') return handleRemove(interaction, ctx, 'drivers');

  if (sub === 'add') {
    const draft = draftFromOptions(interaction);
    const explicitId = trimOption(interaction.options.getString('id'));
    return writeChange(
      interaction,
      ctx,
      'drivers',
      (records) => {
        const id = makeId('drivers', draft, idSet(records), explicitId);
        const record = { id, ...draft };
        records.push(record);
        return { records, record, action: 'add', id };
      },
      { title: 'Driver added', summary: 'The person was written to drivers.json.' },
    );
  }

  if (sub === 'edit') {
    const id = String(interaction.options.getString('id') ?? '').trim();
    return writeChange(
      interaction,
      ctx,
      'drivers',
      (records) => {
        const index = records.findIndex((entry) => entry?.id === id);
        if (index === -1) {
          throw new BotError(`No driver with id "${id}" exists.`, {
            title: 'Record not found',
            details: ['Use the id suggestions, or run /driver list to see the ids.'],
          });
        }
        const { record, changed } = applyEdits(interaction, records[index]);
        if (changed.length === 0) {
          throw new BotError('No fields were supplied, so there was nothing to change.', {
            title: 'Nothing to do',
            details: ['Add at least one option, for example focus or active.'],
          });
        }
        records[index] = record;
        return { records, record, action: 'edit', id, changed };
      },
      {
        title: 'Driver updated',
        summary: (outcome) => `Updated in drivers.json. Fields changed: ${outcome.changed.join(', ')}.`,
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
  return handleIdAutocomplete(interaction, ctx, 'drivers', describeDriver);
}
