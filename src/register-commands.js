/**
 * register-commands.js
 *
 * Tells Discord which slash commands exist. Run it once after the first start,
 * and again whenever an option or description changes.
 *
 *   npm run register         register in DISCORD_GUILD_ID, available at once
 *   npm run register:dry     print the command JSON and exit, no network call
 *   node src/register-commands.js --global
 *                            register for every server the bot is in; Discord
 *                            can take up to an hour to show global commands
 *
 * Guild registration is the normal case: it is instant, and this bot is meant
 * for one team server.
 */

import { REST, Routes } from 'discord.js';
import { buildConfig } from './lib/config.js';
import { toJSON } from './commands/index.js';
import { log, sendInfoToStderr } from './lib/log.js';

const argv = process.argv.slice(2);
const isDryRun = argv.includes('--dry-run');
const isGlobal = argv.includes('--global');

/**
 * Print the command payload without contacting Discord.
 * @param {object[]} body
 */
function printPayload(body) {
  // The payload is the only thing on stdout, so it can be piped into a file or
  // into a JSON tool. The summary below goes to stderr.
  sendInfoToStderr();
  process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
  log.info(`Dry run. ${body.length} command(s) would be registered:`);
  for (const command of body) {
    const subcommands = (command.options ?? []).map((option) => option.name).join(', ');
    log.info(`  /${command.name} - ${subcommands || 'no subcommands'}`);
  }
  log.info('Nothing was sent to Discord.');
}

/**
 * Register the commands.
 * @returns {Promise<number>} exit code
 */
async function main() {
  const body = toJSON();

  // A dry run is offline on purpose, so it works before .env is filled in.
  if (isDryRun) {
    printPayload(body);
    return 0;
  }

  const { ok, errors, config } = buildConfig();
  if (!ok) {
    log.error(`Configuration is not usable. ${errors.length} problem(s) found:`);
    for (const error of errors) log.error(`  - ${error}`);
    return 1;
  }

  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  const route = isGlobal
    ? Routes.applicationCommands(config.discordClientId)
    : Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId);

  const target = isGlobal ? 'every server (global)' : `server ${config.discordGuildId}`;
  log.info(`Registering ${body.length} command(s) for ${target}`);

  try {
    const registered = await rest.put(route, { body });
    log.info(`Registered ${Array.isArray(registered) ? registered.length : 0} command(s):`);
    for (const command of body) log.info(`  /${command.name}`);
    if (isGlobal) log.info('Global commands can take up to an hour to appear in Discord.');
    else log.info('Guild commands are available at once. Reopen the Discord client if you do not see them.');
    return 0;
  } catch (error) {
    const status = error?.status ?? error?.rawError?.code;
    if (status === 401) {
      log.error('Discord rejected the token. Check DISCORD_TOKEN in your .env file.');
    } else if (status === 403) {
      log.error('Discord refused the request. Check that the bot was invited with the applications.commands scope.');
    } else if (status === 404) {
      log.error('Discord could not find the application or the server.');
      log.error('Check DISCORD_CLIENT_ID and DISCORD_GUILD_ID, and that the bot is a member of that server.');
    } else {
      log.error('Registration failed', error);
    }
    if (error?.rawError?.errors) {
      log.error('Discord reported these problems with the command payload:');
      log.error(JSON.stringify(error.rawError.errors, null, 2));
    }
    return 1;
  }
}

process.exitCode = await main();
