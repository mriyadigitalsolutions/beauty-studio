#!/usr/bin/env node
/*
 * Cuts the client's before/after photograph into the two layers the Laser
 * Reveal scene needs, and writes them out as avif/webp/png in three widths.
 *
 * Run by hand, once, and commit the result:
 *
 *     node scripts/prepare-assets.mjs
 *
 * Encoding is deterministic, so running it again rewrites the same bytes.
 *
 * `npm run build` never calls this, so the site does not depend on sharp
 * (specification §6). The source in public/references/ is opened read-only and
 * is never written to.
 *
 * Why the geometry is measured rather than hard-coded: the two frames of the
 * source are two separate exposures, not a registered pair — the leg sits
 * about 250 px further left in the "after" frame and at a slightly different
 * angle. The script finds the silhouette in both halves, fits a line to each,
 * and shifts the "after" crop so the two silhouettes coincide in the middle of
 * the crop. Without that shift the leg visibly jumps across the mask edge.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'public/references/before-after-legs.png');
const OUT_DIR = path.join(root, 'public/scenes');
const MODULE_PATH = path.join(root, 'components/LaserReveal/scene-assets.ts');
const PUBLIC_PREFIX = '/scenes';

/** Three widths, capped by what the crop actually contains — no fake pixels. */
const WIDTH_STEPS = [0.5, 0.75, 1];
const FORMATS = ['avif', 'webp', 'png'];

/** Rows the crop covers in the source, and how tall the crop is. */
const CROP_TOP = 300;
const CROP_HEIGHT = 720;
/** Rows used to fit each silhouette; outside them the leg leaves the frame. */
const FIT_BEFORE = [300, 1150];
const FIT_AFTER = [460, 830];
/** The measurement is expected to land here; a bigger drift means the source
 *  changed and the crop below has to be looked at again by a human. */
const EXPECTED_SHIFT = 249;
const SHIFT_TOLERANCE = 12;

/* ---------------------------------------------------------------- measuring */

/** Columns of the white seam that separates the two frames. */
function findDivider(data, info) {
  const { width, height, channels } = info;
  const bright = [];
  for (let x = Math.floor(width * 0.4); x < Math.floor(width * 0.6); x += 1) {
    let sum = 0;
    let n = 0;
    for (let y = 0; y < height; y += 7) {
      const i = (y * width + x) * channels;
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      n += 1;
    }
    if (sum / n > 230) bright.push(x);
  }
  if (bright.length === 0) throw new Error('no white divider found between the two frames');
  return { start: bright[0], end: bright[bright.length - 1] + 1 };
}

const isSkin = (r, g, b) => r - b > 40 && r > 140 && g - b > 18;

/** For every 4th row, the first column from the left that is skin. */
function silhouette(data, info, box) {
  const { width, channels } = info;
  const points = [];
  for (let y = 0; y < info.height; y += 4) {
    for (let x = box.left; x < box.left + box.width; x += 1) {
      const i = (y * width + x) * channels;
      if (isSkin(data[i], data[i + 1], data[i + 2])) {
        if (x > box.left) points.push([y, x - box.left]);
        break;
      }
    }
  }
  return points;
}

/** Least squares x = c + m·y over the given rows. */
function fitLine(points, [from, to]) {
  const used = points.filter(([y]) => y >= from && y <= to);
  if (used.length < 8) throw new Error(`not enough silhouette samples in rows ${from}..${to}`);
  const n = used.length;
  const sy = used.reduce((a, [y]) => a + y, 0);
  const sx = used.reduce((a, [, x]) => a + x, 0);
  const syy = used.reduce((a, [y]) => a + y * y, 0);
  const sxy = used.reduce((a, [y, x]) => a + y * x, 0);
  const m = (n * sxy - sy * sx) / (n * syy - sy * sy);
  return { m, c: (sx - m * sy) / n };
}

/* ---------------------------------------------------------------- encoding */

async function encode(sharp, crop, name, widths) {
  const written = [];
  for (const width of widths) {
    for (const format of FORMATS) {
      const file = path.join(OUT_DIR, `${name}-${width}.${format}`);
      const pipeline = sharp(crop).resize({ width, kernel: 'lanczos3' });
      const buffer = await (format === 'avif'
        ? pipeline.avif({ quality: 62, effort: 6 })
        : format === 'webp'
          ? pipeline.webp({ quality: 78, effort: 6 })
          : pipeline.png({ compressionLevel: 9, palette: false })
      ).toBuffer();
      await writeFile(file, buffer);
      written.push(path.relative(root, file));
    }
  }
  return written;
}

/** Flat colour and a 20 px blur, so the slot is filled before the photo is. */
async function placeholder(sharp, crop) {
  const tiny = sharp(crop).resize({ width: 20 });
  const { data, info } = await tiny.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0];
  for (let i = 0; i < data.length; i += 3) {
    sum[0] += data[i];
    sum[1] += data[i + 1];
    sum[2] += data[i + 2];
  }
  const pixels = info.width * info.height;
  const hex = `#${sum
    .map((v) => Math.round(v / pixels).toString(16).padStart(2, '0'))
    .join('')}`;
  const blur = await tiny.clone().blur(3).webp({ quality: 50 }).toBuffer();
  return { hex, uri: `data:image/webp;base64,${blur.toString('base64')}` };
}

/* ------------------------------------------------------------------- main */

async function main() {
  const { default: sharp } = await import('sharp');

  const original = await readFile(SOURCE);
  const sourceHash = createHash('sha256').update(original).digest('hex').slice(0, 16);

  const image = sharp(original);
  const meta = await image.metadata();
  const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });

  const divider = findDivider(data, info);
  const before = { left: 0, width: divider.start };
  const after = { left: divider.end, width: meta.width - divider.end };

  const lineBefore = fitLine(silhouette(data, info, before), FIT_BEFORE);
  const lineAfter = fitLine(silhouette(data, info, after), FIT_AFTER);

  /* The row where the two silhouettes are made to coincide. */
  const pivot = CROP_TOP + CROP_HEIGHT / 2;
  const shift = Math.round(
    lineBefore.c - lineAfter.c + (lineBefore.m - lineAfter.m) * pivot,
  );
  if (Math.abs(shift - EXPECTED_SHIFT) > SHIFT_TOLERANCE) {
    throw new Error(
      `silhouettes now want a ${shift} px shift, expected about ${EXPECTED_SHIFT}. ` +
        'The source photograph changed — re-check the crop before committing.',
    );
  }

  const cropWidth = before.width - shift;
  const box = { top: CROP_TOP, width: cropWidth, height: CROP_HEIGHT };
  const crops = {
    legBefore: await image.clone().extract({ ...box, left: shift }).png().toBuffer(),
    legAfter: await image.clone().extract({ ...box, left: after.left }).png().toBuffer(),
  };

  const widths = WIDTH_STEPS.map((step) => Math.round((cropWidth * step) / 2) * 2);
  await mkdir(OUT_DIR, { recursive: true });

  const entries = [];
  for (const [key, crop] of Object.entries(crops)) {
    const name = key === 'legBefore' ? 'leg-before' : 'leg-after';
    await encode(sharp, crop, name, widths);
    entries.push({ key, name, ...(await placeholder(sharp, crop)) });
  }

  /* The line the crop was aligned on, moved into the coordinates of the crop
     itself: the scene reads it from there instead of repeating the numbers. */
  const edge = {
    x0: Math.round((lineBefore.c + lineBefore.m * CROP_TOP - shift) * 1000) / 1000,
    slope: Math.round(lineBefore.m * 100000) / 100000,
  };

  await writeFile(
    MODULE_PATH,
    moduleSource({ entries, widths, cropWidth, sourceHash, edge }),
    'utf8',
  );
  console.log(
    `prepared ${entries.length * widths.length * FORMATS.length} files in ${path.relative(root, OUT_DIR)} ` +
      `(${cropWidth}×${CROP_HEIGHT}, after-frame shifted ${shift} px)`,
  );
}

function moduleSource({ entries, widths, cropWidth, sourceHash, edge }) {
  const image = ({ key, name, hex, uri }) =>
    `export const ${key.replace(/([A-Z])/g, '_$1').toUpperCase()}: SceneImage = {
  id: '${name}',
  width: ${cropWidth},
  height: ${CROP_HEIGHT},
  placeholder: '${hex}',
  blurDataUri:
    '${uri}',
  sources: [
${FORMATS.map(
  (format) =>
    `    { type: 'image/${format}', srcSet: '${widths
      .map((w) => `${PUBLIC_PREFIX}/${name}-${w}.${format} ${w}w`)
      .join(', ')}' },`,
).join('\n')}
  ],
  src: '${PUBLIC_PREFIX}/${name}-${widths[widths.length - 1]}.png',
};`;

  return `/* Generated by scripts/prepare-assets.mjs — do not edit by hand.
 * Source: public/references/before-after-legs.png (sha256:${sourceHash})
 * Re-run the script only when that photograph is replaced. */

export interface SceneImage {
  id: string;
  width: number;
  height: number;
  /** Flat colour of the crop: fills the slot before the photo arrives. */
  placeholder: string;
  /** 20 px blur of the same crop, inlined (R04.1). */
  blurDataUri: string;
  sources: readonly { type: string; srcSet: string }[];
  src: string;
}

export const SCENE_WIDTHS = [${widths.join(', ')}] as const;

/**
 * The left silhouette of the leg as measured on this crop: x = x0 + slope·y.
 * The scene puts the applicator and the hair strokes on the leg with it, so
 * replacing the photograph moves them with the leg instead of leaving them
 * behind.
 */
export const SHIN_EDGE = { x0: ${edge.x0}, slope: ${edge.slope} } as const;

${entries.map(image).join('\n\n')}

/** Both layers share one box, so the scene reserves it once (CLS = 0). */
export const SCENE_ASPECT_RATIO = ${cropWidth} / ${CROP_HEIGHT};
`;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
