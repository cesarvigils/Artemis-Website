/** Reads a `src/data/*.json` file straight off disk, the same file the site
 *  itself imports at build time. Plain fs + JSON.parse rather than a JSON
 *  module import: Playwright's TS loader and Node's import-attribute syntax
 *  do not need to agree on that for a test helper to work everywhere. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '..', '..', 'src', 'data');

export function readData<T = unknown>(file: string): T {
  return JSON.parse(readFileSync(path.join(dataDir, file), 'utf8')) as T;
}
