import type { StatsFile } from './data';

/**
 * `src/data/stats.json` is written by the nightly iRacing sync
 * (`scripts/fetch-iracing.mjs`) and is not in the repository until that sync
 * has run. A plain `import` of a file that may not exist fails the build, so
 * the file is picked up through a glob, which resolves to nothing when it is
 * absent.
 *
 * The pattern carries a wildcard because Vite requires one. `stat*.json` can
 * only ever match `stats.json` in this directory; nothing else in
 * `src/data/` starts with those four letters.
 */
const modules = import.meta.glob<{ default: StatsFile }>('../data/stat*.json', {
  eager: true,
});

const first = Object.values(modules)[0];

/**
 * The parsed file, or undefined. Never trusted: `check-data.mjs` soft-checks
 * it and logs rather than failing, so a malformed sync can still reach here.
 * Every reader (see `driverStats` in data.ts) treats every field as optional.
 */
export const stats: StatsFile | undefined =
  first && typeof first.default === 'object' && first.default !== null
    ? (first.default as StatsFile)
    : undefined;
