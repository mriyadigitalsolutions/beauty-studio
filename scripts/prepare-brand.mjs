/*
 * Draws the tab icon set and the link-card image out of the configuration.
 *
 * Both carry the studio's monogram (story 27) and the palette of §14, and both
 * are files a static host serves, so they cannot be rendered at request time.
 * Run by hand — like `prepare-assets.mjs` — whenever `studio.monogram` or the
 * palette changes; the results are committed:
 *
 *     node scripts/prepare-brand.mjs
 *
 * Neither the monogram nor a colour is written here: the monogram comes from
 * `config/studio.config.ts` (a placeholder until the owner types theirs) and
 * every colour is read out of `styles/tokens.css`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { studio } from '../config/studio.config.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokens = readFileSync(join(root, 'styles/tokens.css'), 'utf8');

/** `--name: #rrggbb` out of the one stylesheet that holds the palette. */
function token(name) {
  const match = tokens.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} is missing from styles/tokens.css`);
  return match[1];
}

const PEACH = token('peach');
const ROSE = token('rose');
const LILAC = token('lilac');
const INK = token('ink');

const escape = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SERIF = 'Bodoni Moda, Didot, Times New Roman, serif';

/** The square mark: monogram in ink on the peach field, over a soft mesh. */
function iconSvg(size) {
  const monogram = escape(studio.monogram);
  /* Long placeholders like `[М]` have to fit the same box a real `AM` would. */
  const fontSize = (size * 0.46) / Math.max(1, monogram.length * 0.62);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="a" cx="30%" cy="18%" r="80%">
      <stop offset="0" stop-color="${LILAC}"/>
      <stop offset="1" stop-color="${PEACH}"/>
    </radialGradient>
    <radialGradient id="b" cx="82%" cy="92%" r="60%">
      <stop offset="0" stop-color="${ROSE}"/>
      <stop offset="1" stop-color="${ROSE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#a)"/>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#b)"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="central"
        font-family="${SERIF}" font-size="${fontSize.toFixed(1)}" fill="${INK}">${monogram}</text>
</svg>`;
}

/** The link card: the same mark, the studio name, nothing invented. */
function ogSvg() {
  const width = 1200;
  const height = 630;
  const name = escape(studio.name);
  const monogram = escape(studio.monogram);
  const nameSize = name.length > 26 ? 56 : 76;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="a" cx="22%" cy="10%" r="85%">
      <stop offset="0" stop-color="${LILAC}"/>
      <stop offset="1" stop-color="${PEACH}"/>
    </radialGradient>
    <radialGradient id="b" cx="88%" cy="95%" r="70%">
      <stop offset="0" stop-color="${ROSE}"/>
      <stop offset="1" stop-color="${ROSE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#a)"/>
  <rect width="${width}" height="${height}" fill="url(#b)"/>
  <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="40"
        fill="#FFFFFF" fill-opacity="0.34" stroke="#FFFFFF" stroke-opacity="0.5"/>
  <circle cx="176" cy="${height / 2}" r="86" fill="#FFFFFF" fill-opacity="0.6"/>
  <text x="176" y="${height / 2}" text-anchor="middle" dominant-baseline="central"
        font-family="${SERIF}" font-size="${(70 / Math.max(1, monogram.length * 0.62)).toFixed(1)}"
        fill="${INK}">${monogram}</text>
  <text x="310" y="${height / 2}" dominant-baseline="central"
        font-family="${SERIF}" font-size="${nameSize}" fill="${INK}">${name}</text>
</svg>`;
}

/** An .ico is a header plus whole PNGs — no second encoder needed. */
function icoFromPng(png, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size >= 256 ? 0 : size, 6);
  header.writeUInt8(size >= 256 ? 0 : size, 7);
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // colour planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, png]);
}

const icons = join(root, 'public/icons');
const og = join(root, 'public/og');
mkdirSync(icons, { recursive: true });
mkdirSync(og, { recursive: true });

const written = [];
function write(path, data) {
  writeFileSync(path, data);
  written.push(`${path.slice(root.length + 1)} — ${data.length} B`);
}

write(join(icons, 'icon.svg'), Buffer.from(iconSvg(512), 'utf8'));

for (const [name, size] of [
  ['favicon-32.png', 32],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  const png = await sharp(Buffer.from(iconSvg(size), 'utf8')).png({ compressionLevel: 9 }).toBuffer();
  write(join(icons, name), png);
  if (size === 32) write(join(icons, 'favicon.ico'), icoFromPng(png, size));
}

write(
  join(og, 'og-image.png'),
  await sharp(Buffer.from(ogSvg(), 'utf8')).png({ compressionLevel: 9 }).toBuffer(),
);

console.log(written.join('\n'));
