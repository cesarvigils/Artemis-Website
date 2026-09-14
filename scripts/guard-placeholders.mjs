#!/usr/bin/env node
/**
 * Placeholder guard for production builds.
 *
 * NOT wired into package.json by this change - that is the orchestrator's
 * call to make. Intended wiring, once it is:
 *
 *   "prebuild": "npm run check:data && node scripts/guard-placeholders.mjs"
 *
 * (After `check:data`, so a malformed file is reported as a data-contract
 * error rather than silently read as "no placeholders" by this script's
 * best-effort JSON parse.)
 *
 * Fails the build (exit 1) only when BOTH are true:
 *   - this is a production build, i.e. either
 *       process.env.VERCEL_GIT_COMMIT_REF === 'master'   (Vercel sets
 *       this from the branch it is building; "master" is this
 *       project's production branch)
 *     or
 *       process.env.ARTEMIS_PRODUCTION === '1'   (manual/local override,
 *       for testing this guard or building "as production" off-branch)
 *   - at least one record across src/data/{results,drivers,events,
 *     partners}.json carries `"_placeholder": true`
 *
 * Everywhere else - preview builds on `preview`, local dev, CI jobs that
 * do not set either variable - placeholder data is expected and fine: the
 * script prints a one-line summary and exits 0.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src', 'data');
const FILES = ['results.json', 'drivers.json', 'events.json', 'partners.json'];

function load(file) {
  try {
    const parsed = JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // check:data (the prebuild step this is meant to run after) is the
    // authority on malformed data; this guard only ever adds a placeholder
    // check on top and never wants to be the confusing first failure.
    console.warn(`guard-placeholders: could not read/parse ${file} (${error.message}); skipping it.`);
    return [];
  }
}

const isProduction =
  process.env.VERCEL_GIT_COMMIT_REF === 'master' || process.env.ARTEMIS_PRODUCTION === '1';

const placeholders = [];
for (const file of FILES) {
  for (const [index, row] of load(file).entries()) {
    if (row && typeof row === 'object' && row._placeholder === true) {
      placeholders.push(`${file}[${index}].id = ${JSON.stringify(row.id ?? '(no id)')}`);
    }
  }
}

if (isProduction && placeholders.length > 0) {
  console.error(
    `guard-placeholders: ${placeholders.length} placeholder record(s) found on a production build ` +
      `(VERCEL_GIT_COMMIT_REF=${JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF ?? null)}, ` +
      `ARTEMIS_PRODUCTION=${JSON.stringify(process.env.ARTEMIS_PRODUCTION ?? null)}):`
  );
  for (const line of placeholders) console.error(`  - ${line}`);
  console.error('Remove or replace these records (or unset the production flag) before deploying.');
  process.exit(1);
}

console.log(
  `guard-placeholders: ok - ${placeholders.length} placeholder record(s) found, production=${isProduction}.`
);
process.exit(0);
