/*
 * The one implementation of the WCAG colour maths in this repository.
 *
 * It was three: `components/FlashTransition/luminance.ts` plus a private copy
 * inside `tests/palette.test.ts` and another inside `tests/hero.test.ts`. Three
 * implementations of one formula cannot disagree loudly — they disagree
 * quietly, and the check that was supposed to catch a regression passes.
 * Everything that weighs a colour now imports from here.
 *
 * Reference: WCAG 2.x, relative luminance and contrast ratio.
 */

/** An sRGB colour as three 0–255 channels. */
export type Rgb = readonly [number, number, number];

/** `#rgb` or `#rrggbb` (with or without the hash) to channels. */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const int = Number.parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(int)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  return [(int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff];
}

/** Channels back to a lowercase `#rrggbb`. */
export function toHex(rgb: Rgb): string {
  return (
    '#' +
    rgb
      .map((channel) => Math.round(Math.min(Math.max(channel, 0), 255)).toString(16).padStart(2, '0'))
      .join('')
  );
}

function toLinear(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an sRGB colour, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Source-over composite of `over` at `alpha` on top of `under`, as a hex string. */
export function composite(under: string, over: string, alpha: number): string {
  const a = Math.min(Math.max(alpha, 0), 1);
  const below = parseHex(under);
  const above = parseHex(over);
  return toHex([0, 1, 2].map((i) => below[i]! * (1 - a) + above[i]! * a) as unknown as Rgb);
}

/** How far the backdrop's luminance moves when the layer is up at `alpha`. */
export function luminanceDelta(backdrop: string, layer: string, alpha: number): number {
  return Math.abs(relativeLuminance(composite(backdrop, layer, alpha)) - relativeLuminance(backdrop));
}

/** WCAG contrast ratio between two opaque colours, 1:1 to 21:1. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}
