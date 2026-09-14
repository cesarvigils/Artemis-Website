/**
 * slug.js
 *
 * Turns human text into the lowercase `[a-z0-9-]` form the data contract uses
 * for record ids. Accents are folded to their ASCII base letter so that
 * "Ines Marchetti" and "Ines Marchetti" produce the same slug.
 */

/** Maximum length of an id in the contract. */
const MAX_SLUG = 80;

/**
 * Convert text to a slug.
 *
 * Examples:
 *   slug("Suzuka 1000")               -> "suzuka-1000"
 *   slug("NASCAR Trucks")             -> "nascar-trucks"
 *   slug("Friday Night Lights, r 9")  -> "friday-night-lights-r-9"
 *   slug("  ---  ")                   -> ""
 *
 * @param {unknown} text
 * @param {{ maxLength?: number }} [options]
 * @returns {string} slug, possibly empty when the input has no usable characters
 */
export function slug(text, options = {}) {
  const maxLength = options.maxLength ?? MAX_SLUG;
  const normalised = String(text ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // drop combining marks left by NFKD (accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (normalised.length <= maxLength) return normalised;
  // Trim to the limit without leaving a trailing separator.
  return normalised.slice(0, maxLength).replace(/-+$/, '');
}

/**
 * Join several parts into one slug, skipping parts that slugify to nothing.
 * @param {...unknown} parts
 * @returns {string}
 */
export function slugJoin(...parts) {
  return parts
    .map((part) => slug(part))
    .filter(Boolean)
    .join('-');
}

export default slug;
