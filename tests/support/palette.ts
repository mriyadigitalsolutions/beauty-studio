/*
 * The palette, read from the one place it is written: `styles/tokens.css`.
 *
 * Before this there were four copies of §14 in the repository — the stylesheet
 * and a literal table in each of three test files — so a token could be edited
 * without a single test noticing. Tests that need a colour as *input* (what a
 * seam cover sits on, what the hero copy is read against) take it from here.
 *
 * The one place that still quotes §14 by hand is `tests/palette.test.ts`: that
 * is the assertion that the stylesheet says what the specification says, and it
 * has to hold a value the stylesheet did not supply.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const repoRoot = new URL('../..', import.meta.url).pathname;

export const tokensCss = readFileSync(join(repoRoot, 'styles/tokens.css'), 'utf8');

export type PaletteName = 'peach' | 'rose' | 'lilac' | 'sand' | 'ink';

/** Names of the four §14 colours a page surface can be painted with (`--ink` is text). */
export const BACKDROP_NAMES = ['peach', 'rose', 'lilac', 'sand'] as const satisfies readonly PaletteName[];

/** `--<name>: #rrggbb` out of the stylesheet, uppercased. */
export function paletteHex(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`token --${name} is not defined in styles/tokens.css`);
  return match[1].toUpperCase();
}

/** `--<name>-rgb: r g b` out of the stylesheet, as `#rrggbb`. */
export function rgbTokenHex(name: string): string {
  const match = tokensCss.match(new RegExp(`--${name}-rgb\\s*:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
  if (!match) throw new Error(`token --${name}-rgb is not defined in styles/tokens.css`);
  return (
    '#' +
    match
      .slice(1, 4)
      .map((channel) => Number(channel).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** The five colours of §14, as the stylesheet defines them. */
export const PALETTE: Record<PaletteName, string> = {
  peach: paletteHex('peach'),
  rose: paletteHex('rose'),
  lilac: paletteHex('lilac'),
  sand: paletteHex('sand'),
  ink: paletteHex('ink'),
};

/** Page surfaces a layer can be composited over. */
export const BACKDROPS: readonly string[] = BACKDROP_NAMES.map((name) => PALETTE[name]);

/** Every `rgb(var(--x-rgb) / a)` of the first block matching `selector`. */
export function layersOf(css: string, selector: string): { color: string; alpha: number }[] {
  const block = css.slice(css.indexOf(selector));
  const body = block.slice(0, block.indexOf('}'));
  return [...body.matchAll(/rgb\(var\(--([a-z]+)-rgb\)\s*\/\s*([\d.]+)\)/g)].map((match) => ({
    color: rgbTokenHex(match[1]!),
    alpha: Number(match[2]),
  }));
}
