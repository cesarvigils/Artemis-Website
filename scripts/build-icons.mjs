#!/usr/bin/env node
/**
 * Regenerates every icon in public/ from the brand SVGs in src/assets/brand/.
 *
 * WHY THIS EXISTS
 *   The icons used to be hand-committed binaries produced by a tool that
 *   lived outside the repository, so there was no way to reproduce them.
 *   `DESIGN.md` referred to "the icon generator" that nobody could run. This
 *   is that generator, committed.
 *
 * WHICH MARK GOES WHERE
 *   `docs/brand-core.md` section 6 splits the logo system by size, and this
 *   script is where that rule is enforced:
 *
 *     Icon (the notched A)  ->  favicon.svg, favicon.ico (16/32/48)
 *     Hero mark (the profile) -> favicon.png (192), apple-touch-icon (180)
 *
 *   The brand core says the hero mark is "96px and above only" and "never an
 *   avatar"; 180 and 192 clear that bar, 16 and 32 do not - measured, the
 *   hero mark at 16px is an unreadable smear while the A still reads. The
 *   split is the rule, not a compromise around it.
 *
 * TRANSPARENCY
 *   Every icon ships on a transparent ground. The marks are Signal
 *   (`#0FFFCF`), which the brand core notes is dark-mode only. `favicon.svg`
 *   therefore carries a `prefers-color-scheme: light` rule that swaps the
 *   fill to Night so the mark stays legible on light browser chrome; the
 *   raster icons cannot do that and are Signal throughout.
 *
 * RUNNING IT
 *   node scripts/build-icons.mjs [--check]
 *
 *   Deliberately NOT wired into `prebuild`. The outputs are committed
 *   binaries; regenerating them on every build would rewrite four files on
 *   every CI run for no reason. Run it by hand when a brand SVG changes.
 *   `--check` rebuilds into memory and reports whether the committed files
 *   are already current, writing nothing - suitable for CI later.
 *
 * DEPENDENCY NOTE
 *   `sharp` is an optionalDependency of `astro` (it is Astro's default image
 *   service), not a direct dependency of this project. That is why it is
 *   imported through a guarded require rather than assumed present.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error(
    'build-icons: sharp is not installed.\n' +
      "It ships as an optional dependency of astro, so `npm install` normally provides it.\n" +
      'If your platform skipped the optional install, run `npm install sharp` and try again.'
  );
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = join(root, 'src', 'assets', 'brand');
const out = join(root, 'public');

const SIGNAL = '#0fffcf';
const NIGHT = '#0a0e0d';

const checkOnly = process.argv.includes('--check');

/** A brand SVG with `currentColor` resolved to a literal fill. */
function markSvg(file, fill) {
  return Buffer.from(
    readFileSync(join(brand, file), 'utf8').replace(/currentColor/g, fill)
  );
}

/**
 * Render a mark centred on a transparent square.
 *
 * `inset` is the share of the square left empty on each side. The brand SVGs
 * are cropped tight to their own ink, so without this the mark would touch
 * all four edges and read as clipped at small sizes.
 */
async function square(svg, size, inset) {
  const inner = Math.max(1, Math.round(size * (1 - inset * 2)));
  const pad = size - inner;
  const left = Math.floor(pad / 2);
  const top = Math.floor(pad / 2);
  return sharp(svg)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top,
      bottom: pad - top,
      left,
      right: pad - left,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

/**
 * Assemble an .ico from PNG payloads.
 *
 * sharp cannot write ICO, and no png-to-ico package is installed, so the
 * container is built by hand. Modern ICOs may embed PNGs directly rather
 * than BMP DIBs, which every browser in use supports and which is what the
 * previous favicon.ico did.
 *
 * Layout: a 6-byte ICONDIR, then one 16-byte ICONDIRENTRY per image, then
 * the payloads. A dimension of 256 is stored as 0.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, data }, i) => {
    const e = i * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, e + 0); // width
    directory.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
    directory.writeUInt8(0, e + 2); // palette size, 0 = truecolour
    directory.writeUInt8(0, e + 3); // reserved
    directory.writeUInt16LE(1, e + 4); // colour planes
    directory.writeUInt16LE(32, e + 6); // bits per pixel
    directory.writeUInt32LE(data.length, e + 8);
    directory.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.data)]);
}

/**
 * favicon.svg, written rather than copied.
 *
 * The path is read from the same file `Mark.astro` derives its icon from, so
 * the favicon and the in-page mark cannot drift. The light-mode rule is the
 * one thing this file has that the rasters cannot: Signal fails contrast on
 * a light ground, so on light browser chrome the mark paints Night instead.
 * Browsers that ignore the media query get the Signal fill, which is the
 * correct default on the dark chrome this brand assumes.
 */
function faviconSvg() {
  const src = readFileSync(join(brand, 'artemis-icon-a.svg'), 'utf8');
  const viewBox = src.match(/viewBox="([^"]+)"/)?.[1];
  const d = src.match(/ d="([^"]+)"/)?.[1];
  if (!viewBox || !d) {
    throw new Error('build-icons: could not read viewBox and path from artemis-icon-a.svg');
  }

  /* The mark is padded into a square viewBox so it has the same breathing
     room as the rasters. The source viewBox is "minX minY width height". */
  const [minX, minY, w, h] = viewBox.split(/\s+/).map(Number);
  const inset = 0.12;
  const side = Math.max(w, h) / (1 - inset * 2);
  const x = minX - (side - w) / 2;
  const y = minY - (side - h) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(x)} ${round(y)} ${round(side)} ${round(side)}">
  <style>
    path { fill: ${SIGNAL}; }
    /* Signal is dark-mode only - it fails contrast on a light ground - so on
       light browser chrome the mark paints Night instead. */
    @media (prefers-color-scheme: light) { path { fill: ${NIGHT}; } }
  </style>
  <path d="${d}"/>
</svg>
`;
}

const round = (n) => Math.round(n * 1000) / 1000;

/* Build ---------------------------------------------------------------- */

const iconSvg = markSvg('artemis-icon-a.svg', SIGNAL);
const heroSvg = markSvg('artemis-mark.svg', SIGNAL);

/* The A is a solid wedge that reaches its own bounding box on three sides,
   so it needs less inset than the hero mark, whose outermost leaf tips are
   hairline-thin and disappear into the edge without room around them. */
const icoImages = await Promise.all(
  [16, 32, 48].map(async (size) => ({ size, data: await square(iconSvg, size, 0.09) }))
);

const artifacts = [
  ['favicon.svg', Buffer.from(faviconSvg(), 'utf8')],
  ['favicon.ico', buildIco(icoImages)],
  ['favicon.png', await square(heroSvg, 192, 0.1)],
  ['apple-touch-icon.png', await square(heroSvg, 180, 0.1)],
];

let stale = 0;
for (const [name, data] of artifacts) {
  const path = join(out, name);
  let current = null;
  try {
    current = readFileSync(path);
  } catch {
    /* a new file; treated as stale below */
  }
  const same = current !== null && current.equals(data);
  if (checkOnly) {
    if (!same) stale += 1;
    console.log(`${same ? 'current' : 'STALE  '}  ${name}  (${data.length} B)`);
    continue;
  }
  if (same) {
    console.log(`unchanged  ${name}  (${data.length} B)`);
    continue;
  }
  writeFileSync(path, data);
  console.log(`wrote      ${name}  (${data.length} B)`);
}

if (checkOnly && stale) {
  console.error(
    `\nbuild-icons: ${stale} icon${stale === 1 ? ' is' : 's are'} out of date. ` +
      'Run `node scripts/build-icons.mjs` and commit the result.'
  );
  process.exit(1);
}
