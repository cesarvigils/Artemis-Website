#!/usr/bin/env node
/**
 * The brief's "empty data" build check, as a plain Node script rather than a
 * Playwright test: it mutates the real `src/data/*.json` files in place
 * (copying the whole project to a temp dir for this is unnecessary weight),
 * so it has to guarantee it puts them back - including when the build
 * itself fails, which is exactly the case this check exists to catch.
 *
 * What it verifies: `check:data` (this project's `prebuild`) treats an
 * empty array as contract-valid and the site renders a deliberate empty
 * state for it (see scripts/check-data.mjs's own comment on this), so
 * `npm run build` with all four data files emptied must still exit 0.
 *
 * Steps:
 *   1. Read and hold results.json, events.json, drivers.json, partners.json
 *      from src/data/ in memory.
 *   2. Overwrite each with `[]\n`.
 *   3. Run `npm run build` in the project root; record whether it exited 0.
 *   4. Restore the four files from memory - in a `finally`, so this runs
 *      even if the build throws.
 *   5. Only if the build passed: assert every restored file is byte-identical
 *      to the copy taken in step 1 (uncommitted edits in the tree are fine).
 *   6. Rebuild once more with the real data restored, so `dist/` does not
 *      linger built from the empty-data run (best-effort; does not affect
 *      the exit code).
 *
 * Wired as `test:empty` in tests/package.json. Run from anywhere; paths are
 * resolved relative to this file, not the current working directory.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(here, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data');
const FILES = ['results.json', 'events.json', 'drivers.json', 'partners.json', 'seats.json'];

// A plain command string through execSync (a real shell) rather than
// execFileSync with an argv array: on Windows, `npm` resolves to `npm.cmd`,
// which execFileSync cannot spawn without a shell, and passing `shell: true`
// to execFileSync alongside an args array is a documented Node.js footgun
// (unescaped concatenation). Every command run here is a fixed literal, so
// shell interpretation carries no injection risk.
function run(command) {
  return execSync(command, { cwd: PROJECT_ROOT, encoding: 'utf8' });
}

const originals = new Map();
for (const file of FILES) {
  originals.set(file, readFileSync(path.join(DATA_DIR, file), 'utf8'));
}

let buildOk = false;
let buildOutput = '';

try {
  for (const file of FILES) {
    writeFileSync(path.join(DATA_DIR, file), '[]\n');
  }
  console.log(`empty-data-build: emptied ${FILES.join(', ')}, running "npm run build"...`);

  try {
    buildOutput = run('npm run build');
    buildOk = true;
    console.log('empty-data-build: build exited 0, as expected.');
  } catch (error) {
    buildOutput = String(error.stdout ?? '') + String(error.stderr ?? '');
    console.error('empty-data-build: FAIL - "npm run build" exited non-zero with empty data.');
    console.error(buildOutput);
  }
} finally {
  for (const [file, content] of originals) {
    writeFileSync(path.join(DATA_DIR, file), content);
  }
  console.log(`empty-data-build: restored ${FILES.join(', ')}.`);
}

let exitCode = buildOk ? 0 : 1;

if (buildOk) {
  // Compare against the in-memory originals rather than `git diff --quiet`:
  // the working tree may legitimately carry uncommitted data edits, and this
  // test only has to prove that the restore put back exactly what it found.
  const damaged = FILES.filter(
    (file) => readFileSync(path.join(DATA_DIR, file), 'utf8') !== originals.get(file),
  );
  if (damaged.length === 0) {
    console.log('empty-data-build: PASS - src/data is byte-identical to before the test.');
  } else {
    exitCode = 1;
    console.error(`empty-data-build: FAIL - restore changed: ${damaged.join(', ')}`);
  }
} else {
  console.error('empty-data-build: skipped the git-diff check because the build itself failed.');
}

// Best-effort cleanup: leave dist/ built from the real data, not the
// emptied set. Never affects the exit code either way.
try {
  run('npm run build');
  console.log('empty-data-build: rebuilt with real data restored.');
} catch (error) {
  console.error(
    'empty-data-build: warning - the cleanup rebuild with real data failed (test result above stands):'
  );
  console.error(String(error.stdout ?? '') + String(error.stderr ?? ''));
}

process.exit(exitCode);
