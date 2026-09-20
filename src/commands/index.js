/**
 * commands/index.js
 *
 * The command registry. Both the gateway client (src/index.js) and the
 * registration script (src/register-commands.js) read this list, so a command
 * can never be handled without being registered, or the other way round.
 *
 * Each module exports:
 *   data         a SlashCommandBuilder
 *   execute      (interaction, ctx) => Promise<void>
 *   autocomplete (interaction, ctx) => Promise<void>   optional
 */

import * as result from './result.js';
import * as driver from './driver.js';
import * as event from './event.js';
import * as dataCommand from './data.js';
import * as health from './health.js';

/** Every command module, in the order they are registered. */
export const commandModules = [result, driver, event, dataCommand, health];

/** Command name -> module, for routing an interaction. */
export const commands = new Map(commandModules.map((module) => [module.data.name, module]));

/**
 * The JSON payload Discord expects when registering the commands.
 * @returns {object[]}
 */
export function toJSON() {
  return commandModules.map((module) => module.data.toJSON());
}
