#!/usr/bin/env node
/**
 * Static file server for `dist/`, close enough to how Vercel serves this
 * project that CSP and cache-control assertions in the test suite mean
 * something.
 *
 * - Directory-style routing: `astro.config.mjs` sets `build.format:
 *   'directory'`, so `/team` on disk is `team/index.html`.
 * - Any path that resolves to nothing is served `404.html` with a real
 *   HTTP 404 status (this is what `vercel.json`'s `/404 -> /` redirect
 *   does NOT touch - that rule is for the literal path `/404`, not for
 *   the not-found fallback).
 * - Response headers are read straight out of `../vercel.json` and applied
 *   by matching each rule's `source` against the request path, the same
 *   way Vercel's `headers` config works. That is what makes the CSP,
 *   cache-control and security-header assertions in the a11y/pages specs
 *   meaningful instead of vacuous.
 *
 * Used two ways:
 *   - as a CLI (`node server.mjs`), which is what playwright.config.ts's
 *     `webServer.command` runs;
 *   - as a module (`import { createServer } from './server.mjs'`), which
 *     lighthouse.mjs uses so it does not have to depend on Playwright's
 *     webServer lifecycle.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DIST_DIR = path.resolve(__dirname, '..', 'dist');
export const VERCEL_JSON = path.resolve(__dirname, '..', 'vercel.json');
export const DEFAULT_PORT = 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

/**
 * Vercel's `source` values are path-to-regexp patterns. The four this
 * project uses are all literal segments plus a `(.*)` or a `(a|b|c)`
 * alternation, so a small literal-escape-and-keep-the-groups translation
 * is enough - no need for the real path-to-regexp package.
 */
function sourceToRegExp(source) {
  const body = source
    .split(/(\([^)]*\))/)
    .map((part) => (part.startsWith('(') ? part : part.replace(/[.*+?^${}|[\]\\]/g, '\\$&')))
    .join('');
  return new RegExp('^' + body + '$');
}

function loadHeaderRules(vercelJsonPath) {
  const cfg = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  return (cfg.headers || []).map((rule) => ({
    re: sourceToRegExp(rule.source),
    headers: rule.headers,
  }));
}

function safeJoin(base, urlPath) {
  const normalized = path.posix.normalize('/' + urlPath.replace(/^\/+/, ''));
  const resolved = path.join(base, normalized);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null;
  return resolved;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function sendFile(res, filePath, status, extraHeaders) {
  const ext = path.extname(filePath).toLowerCase();
  const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', ...extraHeaders };
  res.writeHead(status, headers);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500);
    res.end('Internal error reading file');
  });
}

function headersFor(rules, requestPath) {
  const out = {};
  for (const rule of rules) {
    if (!rule.re.test(requestPath)) continue;
    for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}

/**
 * Creates (but does not start) an http.Server bound to `distDir`, applying
 * `vercel.json`'s header rules to every response. Call `.listen(port)` on
 * the result.
 */
export function createServer({ distDir = DIST_DIR, vercelJsonPath = VERCEL_JSON } = {}) {
  const rules = loadHeaderRules(vercelJsonPath);

  return http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const trimmed = urlPath.replace(/\/+$/, '');
      const extraHeaders = headersFor(rules, urlPath);

      // 1. Directory-style route: /x, /x/ and / all resolve to an index.html.
      const indexRel = trimmed === '' ? 'index.html' : path.posix.join(trimmed, 'index.html');
      const indexCandidate = safeJoin(distDir, indexRel);
      if (indexCandidate && isFile(indexCandidate)) {
        return sendFile(res, indexCandidate, 200, extraHeaders);
      }

      // 2. Exact static file (assets, fonts, favicon, sitemap, robots.txt...).
      const fileCandidate = safeJoin(distDir, urlPath);
      if (fileCandidate && isFile(fileCandidate)) {
        return sendFile(res, fileCandidate, 200, extraHeaders);
      }

      // 3. Not found: dist/404.html, served with a real 404 status. This is
      //    the same file Vercel serves as its not-found document.
      const notFound = path.join(distDir, '404.html');
      if (isFile(notFound)) {
        return sendFile(res, notFound, 404, extraHeaders);
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } catch (error) {
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error: ' + (error && error.message));
    }
  });
}

// CLI entry point: `node server.mjs [port]`. PORT env var wins over the
// positional argument, which wins over DEFAULT_PORT.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error(
      `dist/ has no index.html at ${DIST_DIR}. Run "npm run build" in the project root first.`
    );
    process.exit(1);
  }
  const port = Number(process.env.PORT) || Number(process.argv[2]) || DEFAULT_PORT;
  const server = createServer();
  server.listen(port, () => {
    console.log(`tests/server.mjs serving ${DIST_DIR} at http://localhost:${port}`);
  });
}
