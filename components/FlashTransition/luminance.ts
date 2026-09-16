/*
 * The flash is measured, not eyeballed. Specification §12 and story 39 cap the
 * jump in relative luminance at 0.1 — below the WCAG 2.3.1 flash threshold —
 * so the peak opacities below are the largest ones that stay under that cap on
 * every page background of palette §14. Change a colour, run the test.
 */

/** Peak opacity of the white flash layer. */
export const FLASH_PEAK_OPACITY = 0.26;

/** Peak opacity of the soft dim that replaces the flash below the §10 breakpoint. */
export const DIM_PEAK_OPACITY = 0.05;

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const value = hex.replace('#', '');
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

function toLinear(channel8: number): number {
  const c = channel8 / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.x relative luminance of an sRGB colour, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Source-over composite of `over` at `alpha` on top of `under`, as a hex string. */
export function composite(under: string, over: string, alpha: number): string {
  const a = Math.min(Math.max(alpha, 0), 1);
  const [ur, ug, ub] = parseHex(under);
  const [or, og, ob] = parseHex(over);
  const mix = (u: number, o: number) => Math.round(u * (1 - a) + o * a);
  return (
    '#' +
    [mix(ur, or), mix(ug, og), mix(ub, ob)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** How far the backdrop's luminance moves when the layer is at `alpha`. */
export function luminanceDelta(backdrop: string, layer: string, alpha: number): number {
  return Math.abs(relativeLuminance(composite(backdrop, layer, alpha)) - relativeLuminance(backdrop));
}
