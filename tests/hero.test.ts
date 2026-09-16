import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HERO_MELT, HERO_MELT_BLUR_PX, meltStep } from '@/components/HeroSection/hero-melt';

/*
 * Story 5 (R20): "the hero copy melts, it does not slide away as one block —
 * opacity + blur + y over the pin progress, the headline disappearing before
 * the subtitle". The melt score is a plain data structure so that the order it
 * encodes can be read off without a browser; the scene only plays it back.
 */
describe('the hero melt score', () => {
  it('melts the headline before the subtitle', () => {
    expect(meltStep('title').end).toBeLessThan(meltStep('subtitle').end);
    expect(meltStep('title').start).toBeLessThanOrEqual(meltStep('subtitle').start);
  });

  it('takes the bottom pill away after the copy, last of the three (story 3c)', () => {
    expect(meltStep('cta').end).toBeGreaterThan(meltStep('subtitle').end);
    expect(meltStep('cta').start).toBeGreaterThanOrEqual(meltStep('subtitle').start);
  });

  it('spans the scene once, so scrubbing back plays it in reverse', () => {
    for (const step of HERO_MELT) {
      expect(step.start).toBeGreaterThanOrEqual(0);
      expect(step.end).toBeLessThanOrEqual(1);
      expect(step.end).toBeGreaterThan(step.start);
    }
  });

  it('blurs as it fades rather than only moving', () => {
    expect(HERO_MELT_BLUR_PX).toBeGreaterThan(0);
  });
});

/* ---------------------------------------------------------------------- */

const root = new URL('..', import.meta.url).pathname;
const tokens = readFileSync(join(root, 'styles/tokens.css'), 'utf8');
const globals = readFileSync(join(root, 'app/globals.css'), 'utf8');
const heroCss = readFileSync(join(root, 'components/HeroSection/HeroSection.module.css'), 'utf8');

/** Specification §14 — the palette, quoted rather than read back from the CSS. */
const PALETTE: Record<string, [number, number, number]> = {
  peach: [247, 231, 223],
  rose: [242, 211, 216],
  lilac: [228, 208, 243],
  sand: [232, 216, 207],
  ink: [44, 35, 38],
  white: [255, 255, 255],
};

type Rgb = [number, number, number];

function luminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b]
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lr! + 0.7152 * lg! + 0.0722 * lb!;
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

function over(layer: Rgb, base: Rgb, alpha: number): Rgb {
  return [0, 1, 2].map((i) => layer[i]! * alpha + base[i]! * (1 - alpha)) as Rgb;
}

/** Every `rgb(var(--x-rgb) / a)` inside the first block matching `selector`. */
function layersOf(css: string, selector: string): { color: Rgb; alpha: number }[] {
  const block = css.slice(css.indexOf(selector));
  const body = block.slice(0, block.indexOf('}'));
  return [...body.matchAll(/rgb\(var\(--([a-z]+)-rgb\)\s*\/\s*([\d.]+)\)/g)].map((match) => ({
    color: PALETTE[match[1]!]!,
    alpha: Number(match[2]),
  }));
}

/**
 * Story 47 (R30.1): the copy has to clear 4.5:1 at the lightest and the darkest
 * point of what is behind it. Behind the hero copy there are three things —
 * the peach page, the glass of the card, and the mesh blobs of §14 — so the
 * check composites them the way the browser does instead of trusting the flat
 * palette numbers.
 */
describe('hero copy on the mesh gradient', () => {
  const cardAlpha = Number(tokens.match(/--surface-card:\s*rgb\(var\(--white-rgb\)\s*\/\s*([\d.]+)\)/)![1]);
  const mesh = layersOf(globals, '.meshGradient::before');

  const backdrops: Rgb[] = [];
  for (const page of [PALETTE.peach!, PALETTE.rose!]) {
    const glass = over(PALETTE.white!, page, cardAlpha);
    backdrops.push(glass, page);
    for (const layer of mesh) {
      backdrops.push(over(layer.color, glass, layer.alpha), over(layer.color, page, layer.alpha));
    }
  }

  const sorted = [...backdrops].sort((a, b) => luminance(a) - luminance(b));
  const darkest = sorted[0]!;
  const lightest = sorted[sorted.length - 1]!;

  /* The headline is solid ink; the subtitle is ink at the alpha the hero sets. */
  const subtitleAlpha = Number(heroCss.match(/color:\s*rgb\(var\(--ink-rgb\)\s*\/\s*([\d.]+)\)/)![1]);

  it('found the mesh of §14 to weigh, not an empty list', () => {
    expect(mesh.length).toBeGreaterThanOrEqual(5);
  });

  for (const [name, backdrop] of [
    ['darkest', darkest],
    ['lightest', lightest],
  ] as const) {
    it(`headline clears 4.5:1 at the ${name} point`, () => {
      expect(contrast(PALETTE.ink!, backdrop)).toBeGreaterThanOrEqual(4.5);
    });

    it(`subtitle clears 4.5:1 at the ${name} point`, () => {
      const rendered = over(PALETTE.ink!, backdrop, subtitleAlpha);
      expect(contrast(rendered, backdrop)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

/** Story 46 (R45.1): enlarged browser text must not fall out of the card. */
describe('hero typography scales with the browser', () => {
  it('sets no type in px and no fixed height for text', () => {
    const declarations = [...heroCss.matchAll(/(font-size|line-height|height)\s*:\s*([^;]+);/g)];
    const fixed = declarations
      .filter(([, property]) => property !== 'line-height')
      .filter(([, , value]) => /\d+px/.test(value!) && !/min-height/.test(value!))
      .map(([whole]) => whole);
    expect(fixed).toEqual([]);
    expect(heroCss).toMatch(/min-height:\s*calc\(100svh/);
    expect(heroCss).not.toMatch(/(^|[^-])height:\s*\d+(px|rem|vh)/m);
  });
});
