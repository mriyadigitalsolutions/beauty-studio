/*
 * Three pre-blurred petal sprites — the three depths of the reference.
 *
 * The blur is baked into the sprite once, as an SVG raster the browser paints
 * a single time, and the sprite is used as a *mask*: the colour still comes
 * from the palette tokens, and the animation only ever moves a transform
 * (§11 — `filter: blur()` on a moving element repaints the blur every frame).
 */

const VIEWBOX = 120;

/** Stroke-free petal: a leaf-ish teardrop, wide at the base, curled at the tip. */
const PETAL_PATH =
  'M60 6 C86 26 104 52 104 76 C104 100 84 116 60 116 C36 116 16 100 16 76 C16 52 34 26 60 6 Z';

function sprite(blur: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" width="${VIEWBOX}" height="${VIEWBOX}">` +
    `<filter id="b" x="-40%" y="-40%" width="180%" height="180%">` +
    `<feGaussianBlur stdDeviation="${blur}"/></filter>` +
    `<path d="${PETAL_PATH}" fill="#fff" filter="url(#b)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Depth 0 is nearest and crispest, depth 2 is the far, heavily blurred haze. */
export const PETAL_SPRITES: readonly string[] = [sprite(1.5), sprite(5), sprite(12)];

export type PetalDepth = 0 | 1 | 2;

export function petalSprite(depth: PetalDepth): string {
  return PETAL_SPRITES[depth] ?? PETAL_SPRITES[0]!;
}
