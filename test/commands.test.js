/**
 * Tests for the command definitions and the embed builders.
 *
 * These check the things Discord would otherwise only complain about at
 * registration time: the permission flags, the option order, the choice lists,
 * and the length limits Discord applies to names and descriptions.
 *
 * They also hold the house rules: no emojis and no exclamation marks anywhere
 * in the text the bot shows.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PermissionFlagsBits } from 'discord.js';
import { commandModules, commands, toJSON } from '../src/commands/index.js';
import { CLASS_VALUES, GROUP_VALUES, ROLE_VALUES, STATUS_VALUES } from '../src/lib/schema.js';
import {
  errorEmbed,
  finishText,
  listLine,
  recordFields,
  resultAnnouncementEmbed,
  ANNOUNCEMENT_FOOTER,
  FOOTER_TEXT,
  BRAND_COLOUR,
} from '../src/lib/embeds.js';
import { REFUSAL_TEXT } from '../src/lib/permissions.js';

/** Discord limits, applied to every command, subcommand and option. */
const NAME_MAX = 32;
const DESCRIPTION_MAX = 100;

/** Anything in these ranges is an emoji or a pictograph, which are banned. */
const EMOJI_PATTERN =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/u;

const payload = toJSON();

test('all four commands are defined and routable', () => {
  assert.deepEqual(
    payload.map((command) => command.name),
    ['result', 'driver', 'event', 'data'],
  );
  assert.equal(commands.size, 4);
  for (const name of ['result', 'driver', 'event', 'data']) {
    assert.equal(typeof commands.get(name).execute, 'function');
  }
});

test('every command requires Manage Server and is blocked in direct messages', () => {
  for (const command of payload) {
    assert.equal(
      command.default_member_permissions,
      String(PermissionFlagsBits.ManageGuild),
      `${command.name} does not require Manage Server`,
    );
    assert.equal(command.dm_permission, false, `${command.name} is not blocked in direct messages`);
  }
});

test('each data command has add, edit, remove and list', () => {
  for (const name of ['result', 'driver', 'event']) {
    const command = payload.find((entry) => entry.name === name);
    assert.deepEqual(
      command.options.map((option) => option.name),
      ['add', 'edit', 'remove', 'list'],
    );
  }
});

test('the data command has status, validate and placeholders', () => {
  const command = payload.find((entry) => entry.name === 'data');
  assert.deepEqual(
    command.options.map((option) => option.name),
    ['status', 'validate', 'placeholders'],
  );
});

test('names and descriptions are inside the Discord limits', () => {
  /**
   * @param {{ name: string, description: string, options?: any[] }} node
   * @param {string} where
   */
  const check = (node, where) => {
    assert.equal(node.name.length <= NAME_MAX, true, `${where}: name too long`);
    assert.match(node.name, /^[a-z0-9_-]+$/, `${where}: name must be lowercase`);
    assert.equal(node.description.length > 0, true, `${where}: description missing`);
    assert.equal(
      node.description.length <= DESCRIPTION_MAX,
      true,
      `${where}: description is ${node.description.length} characters, the limit is ${DESCRIPTION_MAX}`,
    );
    for (const child of node.options ?? []) check(child, `${where} ${child.name}`);
  };
  for (const command of payload) check(command, `/${command.name}`);
});

test('required options come before optional ones', () => {
  for (const command of payload) {
    for (const sub of command.options ?? []) {
      const options = sub.options ?? [];
      const lastRequired = options.map((option) => Boolean(option.required)).lastIndexOf(true);
      const firstOptional = options.map((option) => Boolean(option.required)).indexOf(false);
      if (lastRequired !== -1 && firstOptional !== -1) {
        assert.equal(
          lastRequired < firstOptional,
          true,
          `/${command.name} ${sub.name}: a required option comes after an optional one`,
        );
      }
    }
  }
});

test('no subcommand exceeds the 25 option limit, and choices stay inside 25', () => {
  for (const command of payload) {
    for (const sub of command.options ?? []) {
      assert.equal((sub.options ?? []).length <= 25, true, `/${command.name} ${sub.name} has too many options`);
      for (const option of sub.options ?? []) {
        assert.equal((option.choices ?? []).length <= 25, true, `${option.name} has too many choices`);
      }
    }
  }
});

test('enumerated options offer exactly the contract values', () => {
  /**
   * @param {string} commandName
   * @param {string} subName
   * @param {string} optionName
   * @returns {string[]}
   */
  const choicesOf = (commandName, subName, optionName) => {
    const command = payload.find((entry) => entry.name === commandName);
    const sub = command.options.find((entry) => entry.name === subName);
    const option = sub.options.find((entry) => entry.name === optionName);
    return (option.choices ?? []).map((choice) => choice.value);
  };

  assert.deepEqual(choicesOf('result', 'add', 'class'), [...CLASS_VALUES]);
  assert.deepEqual(choicesOf('result', 'edit', 'class'), [...CLASS_VALUES]);
  assert.deepEqual(choicesOf('driver', 'add', 'role'), [...ROLE_VALUES]);
  assert.deepEqual(choicesOf('driver', 'add', 'group'), [...GROUP_VALUES]);
  assert.deepEqual(choicesOf('event', 'add', 'status'), [...STATUS_VALUES]);
});

test('every id option of edit and remove offers autocomplete', () => {
  for (const name of ['result', 'driver', 'event']) {
    const command = payload.find((entry) => entry.name === name);
    for (const subName of ['edit', 'remove']) {
      const sub = command.options.find((entry) => entry.name === subName);
      const id = sub.options.find((entry) => entry.name === 'id');
      assert.equal(id.required, true, `/${name} ${subName}: id must be required`);
      assert.equal(id.autocomplete, true, `/${name} ${subName}: id must offer autocomplete`);
    }
    assert.equal(typeof commands.get(name).autocomplete, 'function');
  }
});

test('every list subcommand takes an optional page number', () => {
  for (const name of ['result', 'driver', 'event']) {
    const command = payload.find((entry) => entry.name === name);
    const list = command.options.find((entry) => entry.name === 'list');
    const page = list.options.find((entry) => entry.name === 'page');
    assert.equal(page.required ?? false, false);
    assert.equal(page.min_value, 1);
  }
});

test('the result options mirror the contract fields', () => {
  const command = payload.find((entry) => entry.name === 'result');
  const add = command.options.find((entry) => entry.name === 'add');
  assert.deepEqual(
    add.options.filter((option) => option.required).map((option) => option.name),
    ['date', 'event', 'track', 'series', 'class', 'position', 'drivers'],
  );
  assert.deepEqual(
    add.options.filter((option) => !option.required).map((option) => option.name),
    ['entries', 'note', 'id'],
  );
  const entries = add.options.find((option) => option.name === 'entries');
  assert.equal(entries.min_value, 2);
  assert.equal(entries.max_value, 999);
});

test('driver add and edit offer iracingid, 1 to 99999999', () => {
  const command = payload.find((entry) => entry.name === 'driver');
  for (const subName of ['add', 'edit']) {
    const sub = command.options.find((entry) => entry.name === subName);
    const option = sub.options.find((entry) => entry.name === 'iracingid');
    assert.equal(option.type, 4); // INTEGER
    assert.equal(option.required ?? false, false);
    assert.equal(option.min_value, 1);
    assert.equal(option.max_value, 99999999);
  }
});

test('the driver clear choices include iracingid, a number field', () => {
  const command = payload.find((entry) => entry.name === 'driver');
  const edit = command.options.find((entry) => entry.name === 'edit');
  const clear = edit.options.find((entry) => entry.name === 'clear');
  const values = clear.choices.map((choice) => choice.value);
  assert.equal(values.includes('iracingid'), true);
});

test('event add and edit offer starttime as a string option', () => {
  const command = payload.find((entry) => entry.name === 'event');
  for (const subName of ['add', 'edit']) {
    const sub = command.options.find((entry) => entry.name === subName);
    const option = sub.options.find((entry) => entry.name === 'starttime');
    assert.equal(option.type, 3); // STRING
    assert.equal(option.required ?? false, false);
  }
});

test('no command text contains an emoji or an exclamation mark', () => {
  const walk = (node, where) => {
    for (const text of [node.name, node.description]) {
      assert.equal(EMOJI_PATTERN.test(text), false, `${where}: contains an emoji`);
      assert.equal(text.includes('!'), false, `${where}: contains an exclamation mark`);
    }
    for (const choice of node.choices ?? []) {
      assert.equal(EMOJI_PATTERN.test(choice.name), false, `${where}: choice contains an emoji`);
    }
    for (const child of node.options ?? []) walk(child, `${where} ${child.name}`);
  };
  for (const command of payload) walk(command, `/${command.name}`);
});

test('every command module exports a builder and a handler', () => {
  for (const module of commandModules) {
    assert.equal(typeof module.data?.toJSON, 'function');
    assert.equal(typeof module.execute, 'function');
  }
});

test('a finish reads as P4, or P4 / 41 when the field size is known', () => {
  assert.equal(finishText({ position: 4 }), 'P4');
  assert.equal(finishText({ position: 4, entries: 41 }), 'P4 / 41');
  assert.equal(finishText({}), 'not set');
});

test('record fields are labelled and never empty', () => {
  const fields = recordFields('results', { id: 'an-id-here', position: 4, entries: 41 });
  const names = fields.map((field) => field.name);
  assert.deepEqual(names.slice(0, 5), ['Id', 'Date', 'Position', 'Entries', 'Class']);
  for (const field of fields) {
    assert.equal(field.value.length > 0, true, `${field.name} has an empty value`);
    assert.equal(EMOJI_PATTERN.test(field.value), false);
  }
});

test('a driver record shows iRacing id only when it is present', () => {
  const withId = recordFields('drivers', { id: 'someone', name: 'Someone', iracingId: 745213 });
  const field = withId.find((entry) => entry.name === 'iRacing id');
  assert.equal(field.value, '745213');

  const without = recordFields('drivers', { id: 'someone', name: 'Someone' });
  assert.equal(without.some((entry) => entry.name === 'iRacing id'), false);
});

test('an event record shows Start time only when it is present', () => {
  const withTime = recordFields('events', { id: 'an-event', name: 'An event', startTime: '2026-09-25T14:00:00Z' });
  const field = withTime.find((entry) => entry.name === 'Start time');
  assert.equal(field.value, '2026-09-25T14:00:00Z');

  const without = recordFields('events', { id: 'an-event', name: 'An event' });
  assert.equal(without.some((entry) => entry.name === 'Start time'), false);
});

test('a driver list line adds the iRacing id only when it is present', () => {
  const withId = listLine('drivers', { id: 'someone', name: 'Someone', group: 'road', number: '7', iracingId: 745213 });
  assert.match(withId, /iRacing 745213/);

  const without = listLine('drivers', { id: 'someone', name: 'Someone', group: 'road', number: '7' });
  assert.equal(/iRacing/.test(without), false);
});

test('an event list line adds the start time only when it is present', () => {
  const withTime = listLine('events', {
    id: 'an-event',
    name: 'An event',
    track: 'A track',
    status: 'confirmed',
    start: '2026-09-25',
    classes: ['GT3'],
    startTime: '2026-09-25T14:00:00Z',
  });
  assert.match(withTime, /14:00 UTC/);

  const without = listLine('events', {
    id: 'an-event',
    name: 'An event',
    track: 'A track',
    status: 'confirmed',
    start: '2026-09-25',
    classes: ['GT3'],
  });
  assert.equal(/UTC/.test(without), false);
});

test('the results announcement title adds "of <entries>" only when entries is set', () => {
  const withEntries = resultAnnouncementEmbed({
    position: 4,
    entries: 41,
    event: 'Suzuka 1000',
    track: 'Suzuka International Racing Course',
    class: 'GT3',
    date: '2026-09-06',
    drivers: ['Matthew Blackley', 'Nolan Walker'],
  }).toJSON();
  assert.equal(withEntries.title, 'P4 of 41 - Suzuka 1000');

  const withoutEntries = resultAnnouncementEmbed({
    position: 4,
    event: 'Suzuka 1000',
    track: 'Suzuka International Racing Course',
    class: 'GT3',
    date: '2026-09-06',
    drivers: ['Matthew Blackley'],
  }).toJSON();
  assert.equal(withoutEntries.title, 'P4 - Suzuka 1000');
});

test('the results announcement carries the note only when one is present, and always lists drivers', () => {
  const withNote = resultAnnouncementEmbed({
    position: 4,
    event: 'Suzuka 1000',
    track: 'Suzuka International Racing Course',
    class: 'GT3',
    date: '2026-09-06',
    note: 'Two stops on strategy, no contact all race.',
    drivers: ['Matthew Blackley', 'Nolan Walker'],
  }).toJSON();
  assert.match(withNote.description, /Two stops on strategy, no contact all race\./);
  assert.match(withNote.description, /Drivers: Matthew Blackley, Nolan Walker/);
  assert.match(withNote.description, /Suzuka International Racing Course \| GT3 \| 2026-09-06/);

  const withoutNote = resultAnnouncementEmbed({
    position: 4,
    event: 'Suzuka 1000',
    track: 'Suzuka International Racing Course',
    class: 'GT3',
    date: '2026-09-06',
    drivers: ['Matthew Blackley'],
  }).toJSON();
  assert.equal(withoutNote.description.split('\n').length, 2);
});

test('the results announcement uses its own footer, not the house one, and carries no emoji or exclamation mark', () => {
  const embed = resultAnnouncementEmbed({
    position: 1,
    entries: 20,
    event: 'Suzuka 1000',
    track: 'Suzuka International Racing Course',
    class: 'GT3',
    date: '2026-09-06',
    note: 'Clean race.',
    drivers: ['Matthew Blackley'],
  }).toJSON();
  assert.equal(embed.footer.text, ANNOUNCEMENT_FOOTER);
  assert.notEqual(embed.footer.text, FOOTER_TEXT);
  assert.equal(embed.color, BRAND_COLOUR);
  assert.equal(EMOJI_PATTERN.test(JSON.stringify(embed)), false);
  assert.equal(embed.title.includes('!'), false);
  assert.equal(embed.description.includes('!'), false);
});

test('a list line is compact, carries the id and marks placeholders', () => {
  const line = listLine('results', {
    id: '2026-09-06-suzuka-1000-gt3',
    date: '2026-09-06',
    position: 4,
    entries: 41,
    class: 'GT3',
    event: 'Suzuka 1000',
    track: 'Suzuka International Racing Course',
    _placeholder: true,
  });
  assert.match(line, /P4 \/ 41/);
  assert.match(line, /\(placeholder\)/);
  assert.match(line, /id: 2026-09-06-suzuka-1000-gt3/);
  assert.equal(line.length <= 300, true);
});

test('embeds carry the house footer, colour and no emoji', () => {
  const embed = errorEmbed({ title: 'Not allowed', message: REFUSAL_TEXT, details: ['Ask an administrator.'] }).toJSON();
  assert.equal(embed.footer.text, FOOTER_TEXT);
  assert.equal(EMOJI_PATTERN.test(JSON.stringify(embed)), false);
  assert.equal(embed.description.includes('!'), false);
  assert.equal(BRAND_COLOUR, 0x0fffcf);
});
