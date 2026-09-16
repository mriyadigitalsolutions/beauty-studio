/*
 * Three pre-blurred petal sprites — the three depths of the reference.
 *
 * The blur is baked into the sprite once, as an SVG raster the browser paints
 * a single time, and the sprite is used as a *mask*: the colour still comes
 * from the palette tokens, and the animation only ever moves a transform
 * (§11 — `filter: blur()` on a moving element repaints the blur every frame).
 */

const VIEWBOX = 120;

/*
 * A blossom petal as the reference draws it: narrow, rounded at the top,
 * drawn to a tip at the bottom, with one side fuller than the other. A round
 * teardrop reads as a light blob once it is blurred; this one keeps a petal's
 * silhouette even in the far plane.
 */
const PETAL_PATH =
  'M60 116 C 31 93 15 63 21 39 C 26 16 43 5 60 5 C 77 5 97 17 101 40 C 106 67 88 96 60 116 Z';

function sprite(blur: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" width="${VIEWBOX}" height="${VIEWBOX}">` +
    `<filter id="b" x="-40%" y="-40%" width="180%" height="180%">` +
    `<feGaussianBlur stdDeviation="${blur}"/></filter>` +
    `<path d="${PETAL_PATH}" fill="#fff" filter="url(#b)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Depth 0 is nearest and crispest, depth 2 is the far, heavily blurred haze. */
/*
 * Three degrees of blur, and the strongest one is still a petal: past roughly
 * a tenth of the sprite the silhouette dissolves into a glow, which is exactly
 * the "засветка" the reference does not have.
 */
export const PETAL_SPRITES: readonly string[] = [sprite(0.8), sprite(3.2), sprite(7)];

export type PetalDepth = 0 | 1 | 2;

export function petalSprite(depth: PetalDepth): string {
  return PETAL_SPRITES[depth] ?? PETAL_SPRITES[0]!;
}
