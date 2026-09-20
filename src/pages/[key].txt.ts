import type { APIRoute, GetStaticPaths } from 'astro';

/**
 * The IndexNow key file.
 *
 * WHAT INDEXNOW IS
 *   A push protocol: instead of waiting for a crawler to come back, the
 *   site tells the engine a URL changed. One POST reaches Bing, Yandex,
 *   Seznam and Naver at once. Google does not participate.
 *
 *   It earns its place here for a second-order reason. Bing's index is
 *   what ChatGPT's search is grounded in, and AI answers are a surface
 *   this site is otherwise entirely passive on - so the engine that gets
 *   told first is the one feeding the assistant, not just the search box.
 *
 * HOW OWNERSHIP IS PROVEN
 *   By serving the key back at `/<key>.txt`. Anyone can read it; that is
 *   the design, and it is not a secret - possession of the file proves
 *   control of the host, which is the only thing the protocol checks. It
 *   is kept in an environment variable rather than committed for a duller
 *   reason: rotating it should not need a code change, and a key sitting
 *   in git history outlives the rotation.
 *
 *   Bing will not follow a redirect to find this file, so it has to be a
 *   200 at the exact host used in submissions. `trailingSlash: false` in
 *   vercel.json already guarantees that for a `.txt` path.
 *
 * WHEN THE VARIABLE IS UNSET
 *   `getStaticPaths` returns nothing and no file is emitted. The site is
 *   unchanged and the workflow that pings the endpoint skips itself for
 *   the same reason, so a fork or a preview never advertises a key it
 *   cannot honour.
 *
 * Setup is in DEPLOY.md.
 */

const rawKey = import.meta.env.INDEXNOW_KEY;
const key = typeof rawKey === 'string' ? rawKey.trim() : '';

/* The protocol requires 8-128 characters, hex-ish (a-z, A-Z, 0-9, -). A key
   that cannot be valid is treated as unset rather than shipped: a 404 on
   the key file is a clean "not configured", while a malformed key that
   serves fine fails later, at the endpoint, where nobody is watching. */
const usable = /^[A-Za-z0-9-]{8,128}$/.test(key);

export const getStaticPaths: GetStaticPaths = () => (usable ? [{ params: { key } }] : []);

export const GET: APIRoute = ({ params }) =>
  new Response(`${params.key}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
