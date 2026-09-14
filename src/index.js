/**
 * index.js
 *
 * The bot process. It:
 *  - loads and validates the configuration, and stops with a readable list when
 *    something is missing (see src/lib/config.js)
 *  - logs in with the Guilds intent only, which is not a privileged intent
 *  - routes slash commands and autocomplete requests to src/commands
 *  - checks the Manage Server permission again at run time
 *  - answers every failure with an ephemeral error embed and never crashes
 *  - shuts down cleanly on SIGINT and SIGTERM
 *
 * Run "node src/index.js --check" to validate the configuration and, in local
 * storage mode, read the three data files and report what is in them. That mode
 * does not contact Discord.
 *
 * Usage:
 *   npm start        run the bot
 *   npm run dev      run the bot and restart on file changes
 *   npm run check    configuration and data check, then exit
 */

import { Client, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { buildConfig, describeStorage, loadConfigOrExit } from './lib/config.js';
import { createStorage, readRecords } from './lib/storage.js';
import { validateArray } from './lib/validate.js';
import { ensureAllowed, isAllowed } from './lib/permissions.js';
import { commands } from './commands/index.js';
import { replyError } from './commands/shared.js';
import { FILES, KINDS } from './lib/schema.js';
import { log } from './lib/log.js';

/**
 * Configuration and data check. Nothing here contacts Discord.
 *
 * With STORAGE=local the three files are read from disk. With STORAGE=github
 * they are read through the API, which needs a working token.
 *
 * @returns {Promise<number>} the exit code: 0 when everything is valid
 */
export async function runCheck() {
  const { ok, errors, config } = buildConfig();

  log.info('Artemis data bot, configuration check');
  if (!ok) {
    log.error(`Configuration is not usable. ${errors.length} problem(s) found:`);
    for (const error of errors) log.error(`  - ${error}`);
    return 1;
  }
  log.info('Configuration OK');
  log.info(`  storage mode: ${config.storage}`);
  log.info(`  data source:  ${describeStorage(config)}`);
  log.info(`  audit channel: ${config.logChannelId || 'not set'}`);

  const storage = createStorage(config);
  let failed = false;

  for (const kind of KINDS) {
    try {
      const { records } = await readRecords(storage, kind, { validate: false });
      const { errors: problems } = validateArray(kind, records);
      if (problems.length === 0) {
        log.info(`  ${FILES[kind]}: ${records.length} record(s), valid`);
      } else {
        failed = true;
        log.error(`  ${FILES[kind]}: ${records.length} record(s), ${problems.length} problem(s)`);
        for (const problem of problems.slice(0, 20)) log.error(`      ${problem}`);
        if (problems.length > 20) log.error(`      and ${problems.length - 20} more`);
      }
    } catch (error) {
      failed = true;
      log.error(`  ${FILES[kind]}: could not be read. ${error.message}`);
    }
  }

  if (failed) {
    log.error('Check finished with problems.');
    return 1;
  }
  log.info('Check finished. All three files are valid.');
  return 0;
}

/**
 * Handle one chat input command.
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {object} ctx
 * @returns {Promise<void>}
 */
async function handleCommand(interaction, ctx) {
  const module = commands.get(interaction.commandName);
  if (!module) {
    log.warn(`Received an unknown command: ${interaction.commandName}`);
    await interaction.reply({
      content: 'That command is not known to this bot. Run the register script again.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Second permission check. Discord already hides these commands from members
  // without Manage Server, but a server override could let one through.
  if (!(await ensureAllowed(interaction))) return;

  // Every reply is ephemeral: the audit channel is where the team sees changes.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const started = Date.now();
  log.info('Running a command', {
    command: `${interaction.commandName} ${interaction.options.getSubcommand(false) ?? ''}`.trim(),
    user: interaction.user?.username,
    userId: interaction.user?.id,
    guild: interaction.guildId,
  });

  await module.execute(interaction, ctx);
  log.debug(`Command finished in ${Date.now() - started} ms`);
}

/**
 * Handle one autocomplete request. Discord allows three seconds, so failures
 * answer with an empty list rather than leaving the field hanging.
 * @param {import('discord.js').AutocompleteInteraction} interaction
 * @param {object} ctx
 * @returns {Promise<void>}
 */
async function handleAutocomplete(interaction, ctx) {
  const module = commands.get(interaction.commandName);
  if (!module?.autocomplete) {
    await interaction.respond([]);
    return;
  }
  if (!isAllowed(interaction)) {
    await interaction.respond([]);
    return;
  }
  await module.autocomplete(interaction, ctx);
}

/**
 * Start the bot.
 * @returns {Promise<void>}
 */
async function main() {
  const config = loadConfigOrExit();
  const storage = createStorage(config);

  // Guilds is the only intent needed for slash commands, and it is not privileged.
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const ctx = { config, storage, client };

  client.once(Events.ClientReady, (ready) => {
    log.info(`Logged in as ${ready.user.tag}`);
    log.info(`Data source: ${describeStorage(config)}`);
    log.info(`Commands ready: ${[...commands.keys()].join(', ')}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, ctx);
      } else if (interaction.isAutocomplete()) {
        await handleAutocomplete(interaction, ctx);
      }
    } catch (error) {
      // One failing command must never take the bot down.
      if (interaction.isAutocomplete()) {
        log.error('Autocomplete failed', error);
        try {
          if (!interaction.responded) await interaction.respond([]);
        } catch {
          // The three second window closed; nothing more can be done.
        }
        return;
      }
      await replyError(interaction, error);
    }
  });

  client.on(Events.Error, (error) => log.error('Discord client error', error));
  client.on(Events.Warn, (message) => log.warn(`Discord client warning: ${message}`));

  // Last line of defence. The bot stays up: a restart would drop every pending
  // command, and the process manager restarts it if it ever does exit.
  process.on('unhandledRejection', (reason) => log.error('Unhandled promise rejection', reason));
  process.on('uncaughtException', (error) => log.error('Uncaught exception', error));

  let shuttingDown = false;
  /**
   * Log out and exit.
   * @param {string} signal
   */
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info(`Received ${signal}, shutting down`);
    try {
      await client.destroy();
    } catch (error) {
      log.warn('Could not close the Discord connection cleanly', error?.message ?? error);
    }
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  log.info('Starting the Artemis data bot');
  await client.login(config.discordToken);
}

// Entry point. --check never logs in to Discord.
if (process.argv.includes('--check')) {
  process.exitCode = await runCheck();
} else {
  await main();
}
