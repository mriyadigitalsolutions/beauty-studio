import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HERO_MELT, HERO_MELT_BLUR_PX, meltStep } from '@/components/HeroSection/hero-melt';
import { composite, contrastRatio, relativeLuminance } from '@/lib/color/wcag';
import { PALETTE, layersOf, repoRoot, rgbTokenHex } from './support/palette';

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

const tokens = readFileSync(join(repoRoot, 'styles/tokens.css'), 'utf8');
const globals = readFileSync(join(repoRoot, 'app/globals.css'), 'utf8');
const heroCss = readFileSync(join(repoRoot, 'components/HeroSection/HeroSection.module.css'), 'utf8');

/**
 * Story 47 (R30.1): the copy has to clear 4.5:1 at the lightest and the darkest
 * point of what is behind it. Behind the hero copy there are three things —
 * the peach page, the glass of the card, and the mesh blobs of §14 — so the
 * check composites them the way the browser does instead of trusting the flat
 * palette numbers. Every colour comes from `styles/tokens.css`, the one place
 * the palette is written.
 */
describe('hero copy on the mesh gradient', () => {
  const cardAlpha = Number(tokens.match(/--surface-card:\s*rgb\(var\(--white-rgb\)\s*\/\s*([\d.]+)\)/)![1]);
  const white = rgbTokenHex('white');
  const mesh = layersOf(globals, '.meshGradient::before');

  const backdrops: string[] = [];
  for (const page of [PALETTE.peach, PALETTE.rose]) {
    const glass = composite(page, white, cardAlpha);
    backdrops.push(glass, page);
    for (const layer of mesh) {
      backdrops.push(composite(glass, layer.color, layer.alpha), composite(page, layer.color, layer.alpha));
    }
  }

  const sorted = [...backdrops].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
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
      expect(contrastRatio(PALETTE.ink, backdrop)).toBeGreaterThanOrEqual(4.5);
    });

    it(`subtitle clears 4.5:1 at the ${name} point`, () => {
      const rendered = composite(backdrop, PALETTE.ink, subtitleAlpha);
      expect(contrastRatio(rendered, backdrop)).toBeGreaterThanOrEqual(4.5);
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
