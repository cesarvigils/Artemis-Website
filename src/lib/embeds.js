/**
 * embeds.js
 *
 * Every reply the bot sends is built here, so wording and layout stay uniform.
 *
 * House style, set by the team owner:
 *  - no emojis anywhere, in any field, at any time
 *  - no exclamation marks
 *  - a title, labelled fields and the footer "Artemis data bot"
 *  - short sentences; say what happened and what to do next
 */

import { EmbedBuilder } from 'discord.js';
import { FILES, SINGULAR } from './schema.js';

/** Team colour, used for every embed except errors. */
export const BRAND_COLOUR = 0x0fffcf;

/** A muted red, used only for errors so they are easy to spot. */
export const ERROR_COLOUR = 0xc0392b;

/** Amber, used only by /health for a report that works but needs attention. */
export const WARN_COLOUR = 0xd08b18;

/** Text of the footer on every embed. */
export const FOOTER_TEXT = 'Artemis data bot';

/** Discord limits, applied defensively so a long note can never break a reply. */
const LIMITS = { title: 256, description: 4096, fieldName: 256, fieldValue: 1024, footer: 2048 };

/** Shown instead of an empty value, because Discord rejects empty field values. */
const EMPTY = 'not set';

/**
 * Shorten text to a limit, marking that it was cut.
 * @param {unknown} value
 * @param {number} max
 * @returns {string}
 */
export function truncate(value, max) {
  const text = String(value ?? '');
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}

/**
 * A field value that is never empty.
 * @param {unknown} value
 * @returns {string}
 */
function fieldValue(value) {
  const text = String(value ?? '').trim();
  return truncate(text.length > 0 ? text : EMPTY, LIMITS.fieldValue);
}

/**
 * Start an embed with the house footer and colour.
 * @param {number} colour
 * @returns {EmbedBuilder}
 */
function base(colour) {
  return new EmbedBuilder().setColor(colour).setFooter({ text: FOOTER_TEXT }).setTimestamp(new Date());
}

/**
 * A plain informational embed.
 * @param {{ title: string, description?: string, fields?: Array<{ name: string, value: string, inline?: boolean }> }} options
 * @returns {EmbedBuilder}
 */
export function infoEmbed(options) {
  const embed = base(BRAND_COLOUR).setTitle(truncate(options.title, LIMITS.title));
  if (options.description) embed.setDescription(truncate(options.description, LIMITS.description));
  if (options.fields?.length) {
    embed.addFields(
      options.fields.slice(0, 25).map((field) => ({
        name: truncate(field.name, LIMITS.fieldName),
        value: fieldValue(field.value),
        inline: field.inline ?? false,
      })),
    );
  }
  return embed;
}

/**
 * Confirmation of a change that was written.
 * @param {{ title: string, description?: string, fields?: Array<{ name: string, value: string, inline?: boolean }> }} options
 * @returns {EmbedBuilder}
 */
export function successEmbed(options) {
  return infoEmbed(options);
}

/**
 * An error an operator can act on.
 *
 * Fields are optional and only used where an error carries structured detail
 * as well as a sentence, as the failed build post in audit.js does.
 *
 * @param {{
 *   title?: string,
 *   message: string,
 *   details?: string[],
 *   fields?: Array<{ name: string, value: string, inline?: boolean }>
 * }} options
 * @returns {EmbedBuilder}
 */
export function errorEmbed(options) {
  const lines = [options.message];
  if (options.details?.length) {
    lines.push('', ...options.details.map((detail) => `- ${detail}`));
  }
  const embed = base(ERROR_COLOUR)
    .setTitle(truncate(options.title || 'Error', LIMITS.title))
    .setDescription(truncate(lines.join('\n'), LIMITS.description));
  if (options.fields?.length) {
    embed.addFields(
      options.fields.slice(0, 25).map((field) => ({
        name: truncate(field.name, LIMITS.fieldName),
        value: fieldValue(field.value),
        inline: field.inline ?? false,
      })),
    );
  }
  return embed;
}

/**
 * Human readable summary of one field value for the record embeds.
 * @param {unknown} value
 * @returns {string}
 */
function show(value) {
  if (value === undefined || value === null) return EMPTY;
  if (Array.isArray(value)) return value.length ? value.join(', ') : EMPTY;
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const text = String(value).trim();
  return text.length ? text : EMPTY;
}

/**
 * How a finish reads: "P4" on its own, or "P4 / 41" when the number of cars in
 * the class or split is known. This is the form the website uses.
 * @param {Record<string, any>} record a result record
 * @returns {string}
 */
export function finishText(record) {
  const position = record?.position;
  if (position === undefined || position === null) return EMPTY;
  return record?.entries ? `P${position} / ${record.entries}` : `P${position}`;
}

/**
 * Fields of one record, in the order the contract lists them.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Record<string, any>} record
 * @returns {Array<{ name: string, value: string, inline?: boolean }>}
 */
export function recordFields(kind, record) {
  if (kind === 'results') {
    return [
      { name: 'Id', value: show(record.id) },
      { name: 'Date', value: show(record.date), inline: true },
      // The site renders the pair as "P4 / 41" when the field size is known.
      { name: 'Position', value: finishText(record), inline: true },
      { name: 'Entries', value: show(record.entries), inline: true },
      { name: 'Class', value: show(record.class), inline: true },
      { name: 'Event', value: show(record.event) },
      { name: 'Track', value: show(record.track), inline: true },
      { name: 'Series', value: show(record.series), inline: true },
      { name: 'Drivers', value: show(record.drivers) },
      { name: 'Note', value: show(record.note) },
    ];
  }
  if (kind === 'drivers') {
    const stats = [];
    if (record.stats?.irating !== undefined) stats.push(`iRating ${record.stats.irating}`);
    if (record.stats?.licence !== undefined) stats.push(`Licence ${record.stats.licence}`);
    const socials = Object.entries(record.socials || {})
      .filter(([, link]) => typeof link === 'string' && link.length > 0)
      .map(([key, link]) => `${key}: ${link}`);
    return [
      { name: 'Id', value: show(record.id) },
      { name: 'Name', value: show(record.name), inline: true },
      { name: 'Number', value: show(record.number), inline: true },
      { name: 'Country', value: show(record.country), inline: true },
      { name: 'Role', value: show(record.role), inline: true },
      { name: 'Group', value: show(record.group), inline: true },
      { name: 'Active', value: show(record.active ?? true), inline: true },
      { name: 'Focus', value: show(record.focus) },
      { name: 'Bio', value: show(record.bio) },
      { name: 'Stats', value: stats.length ? stats.join(', ') : EMPTY },
      { name: 'Socials', value: socials.length ? socials.join('\n') : EMPTY },
      // iracingId is only shown when set, unlike the fields above: it is the
      // one field a person may never have (see docs/data-contract.md 1.2).
      ...(record.iracingId !== undefined ? [{ name: 'iRacing id', value: show(record.iracingId), inline: true }] : []),
    ];
  }
  return [
    { name: 'Id', value: show(record.id) },
    { name: 'Name', value: show(record.name) },
    { name: 'Track', value: show(record.track), inline: true },
    { name: 'Status', value: show(record.status), inline: true },
    { name: 'Start', value: show(record.start), inline: true },
    { name: 'End', value: show(record.end), inline: true },
    // Shown only when present, same reasoning as iracingId above.
    ...(record.startTime !== undefined ? [{ name: 'Start time', value: `${show(record.startTime)}`, inline: true }] : []),
    { name: 'Classes', value: show(record.classes) },
    { name: 'Note', value: show(record.note) },
  ];
}

/**
 * Full view of one record, used after add and edit and in the remove prompt.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Record<string, any>} record
 * @param {{ title: string, description?: string, extraFields?: Array<{ name: string, value: string, inline?: boolean }> }} options
 * @returns {EmbedBuilder}
 */
export function recordEmbed(kind, record, options) {
  return infoEmbed({
    title: options.title,
    description: options.description,
    fields: [...recordFields(kind, record), ...(options.extraFields ?? [])],
  });
}

/**
 * One compact line for a record in a list.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Record<string, any>} record
 * @returns {string}
 */
export function listLine(kind, record) {
  const placeholder = record._placeholder === true ? ' (placeholder)' : '';
  let line;
  if (kind === 'results') {
    line = [
      show(record.date),
      finishText(record),
      show(record.class),
      show(record.event),
      show(record.track),
    ].join(' | ');
  } else if (kind === 'drivers') {
    const number = String(record.number ?? '').length ? `no ${record.number}` : 'no number';
    const active = record.active === false ? 'inactive' : 'active';
    const parts = [show(record.name), number, show(record.group), show(record.role), show(record.focus), active];
    if (record.iracingId !== undefined) parts.push(`iRacing ${record.iracingId}`);
    line = parts.join(' | ');
  } else {
    const span = record.end && record.end !== record.start ? `${show(record.start)} to ${show(record.end)}` : show(record.start);
    const parts = [span, show(record.status), show(record.name), show(record.track), show(record.classes)];
    if (record.startTime !== undefined) parts.push(`${record.startTime.slice(11, 16)} UTC`);
    line = parts.join(' | ');
  }
  return truncate(`${line}${placeholder}\nid: ${show(record.id)}`, 300);
}

/**
 * A page of records, at most ten to a page, one line each.
 * @param {'results'|'drivers'|'events'} kind
 * @param {Array<Record<string, any>>} pageRecords the records on this page
 * @param {{ page: number, pages: number, total: number, offset: number, source: string }} options
 *        offset is the index of the first record on this page, used for numbering
 * @returns {EmbedBuilder}
 */
export function listEmbed(kind, pageRecords, options) {
  const heading = `${FILES[kind]}, ${options.total} record(s)`;
  const body = pageRecords.length
    ? pageRecords.map((record, index) => `${options.offset + index + 1}. ${listLine(kind, record)}`).join('\n\n')
    : 'No records on this page.';
  return infoEmbed({
    title: `${SINGULAR[kind].replace(/^./, (c) => c.toUpperCase())} list`,
    description: truncate(`${heading}\nPage ${options.page} of ${options.pages}\n\n${body}`, LIMITS.description),
    fields: [{ name: 'Source', value: options.source }],
  });
}

/**
 * The line the contract asks every write confirmation to carry.
 *
 * In GitHub mode the wording depends on whether the bot will follow the build:
 * when it will, it promises to come back rather than promising a result it has
 * not seen yet. A build that fails leaves the previous deployment live, so
 * "live in about a minute" was only ever true when the build passed.
 *
 * @param {'local'|'github'} mode
 * @param {{ watching?: boolean }} [options]
 * @returns {string}
 */
export function liveNote(mode, options = {}) {
  if (mode !== 'github') {
    return 'Local storage mode. The file on disk was changed, nothing was pushed.';
  }
  return options.watching
    ? 'Committed. The build takes about a minute; the bot will follow up here only if it fails.'
    : 'Live in about a minute once Vercel finishes building.';
}

/**
 * The /health report: one line per probe, coloured by the worst result.
 *
 * States are written as words rather than emoji, which is the house style the
 * command tests enforce, and the worst result decides the colour so the answer
 * is readable before a single line is.
 *
 * @param {{
 *   probes: Array<{ name: string, state: 'ok'|'warn'|'fail', detail: string }>,
 *   state: 'ok'|'warn'|'fail',
 *   summary: string
 * }} report
 * @returns {EmbedBuilder}
 */
export function healthEmbed(report) {
  const colour = report.state === 'fail' ? ERROR_COLOUR : report.state === 'warn' ? WARN_COLOUR : BRAND_COLOUR;
  const embed = base(colour)
    .setTitle(truncate(`Bot health: ${report.state}`, LIMITS.title))
    .setDescription(truncate(report.summary, LIMITS.description));

  embed.addFields(
    report.probes.slice(0, 25).map((probe) => ({
      name: truncate(`${probe.name} - ${probe.state}`, LIMITS.fieldName),
      value: fieldValue(probe.detail),
      inline: false,
    })),
  );

  return embed;
}

/** Footer of the public results announcement, a different name from the rest of the bot on purpose. */
export const ANNOUNCEMENT_FOOTER = 'The Scoreboard';

/**
 * The public results announcement, posted to RESULTS_CHANNEL_ID (when set) by
 * /result add. This is the brand's locked template: the bot never adds an
 * adjective of its own, only the values of the record and, when the operator
 * typed one, the note.
 *
 *   P4 of 41 - Suzuka 1000
 *   Suzuka International Racing Course | GT3 | 2026-09-06
 *   Two stops on strategy, no contact all race.
 *   Drivers: Matthew Blackley, Nolan Walker
 *
 * @param {Record<string, any>} record a result record
 * @returns {EmbedBuilder}
 */
export function resultAnnouncementEmbed(record) {
  const positionText = record.entries ? `P${record.position} of ${record.entries}` : `P${record.position}`;
  const title = `${positionText} - ${record.event}`;

  const lines = [`${record.track} | ${record.class} | ${record.date}`];
  if (record.note) lines.push(record.note);
  lines.push(`Drivers: ${(record.drivers ?? []).join(', ')}`);

  return new EmbedBuilder()
    .setColor(BRAND_COLOUR)
    .setTitle(truncate(title, LIMITS.title))
    .setDescription(truncate(lines.join('\n'), LIMITS.description))
    .setFooter({ text: ANNOUNCEMENT_FOOTER })
    .setTimestamp(new Date());
}
