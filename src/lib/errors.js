/**
 * errors.js
 *
 * One error type for problems an operator can act on. Command handlers turn a
 * BotError into an error embed and show its message as written, so the message
 * must be a plain, complete sentence with no emojis and no exclamation marks.
 *
 * Anything that is not a BotError is treated as a bug: the operator sees a
 * generic message and the stack goes to the log.
 */

export class BotError extends Error {
  /**
   * @param {string} message shown to the operator
   * @param {{ title?: string, details?: string[], cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'BotError';
    /** Short heading for the error embed. */
    this.title = options.title ?? 'Command failed';
    /** Extra lines, for example a list of validation problems. */
    this.details = options.details ?? [];
  }
}

/**
 * True when the error is meant to be shown to the operator as written.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isBotError(error) {
  return error instanceof BotError;
}
