import { describe, expect, it } from 'vitest';
import {
  FLASH_MIN_GAP_MS,
  flashDuration,
  createFlashLimiter,
} from '@/components/FlashTransition/flash-limiter';
import {
  composite,
  luminanceDelta,
  relativeLuminance,
} from '@/components/FlashTransition/luminance';
import {
  DIM_PHASES,
  FLASH_PHASES,
  layerOpacityAt,
  phaseEnd,
  phasesDuration,
  type FlashPhase,
} from '@/components/FlashTransition/flash-phases';

/* Page backgrounds a seam cover can sit on — palette §14 minus --ink, which is text. */
const BACKDROPS = ['#F7E7DF', '#F2D3D8', '#E4D0F3', '#E8D8CF'];

/*
 * What the eye actually gets at a moment in time: every layer that is up at
 * `timeMs`, composited over the backdrop in paint order (bloom sits under the
 * flash). Measuring one layer alone would miss exactly the case the overlay is
 * built to avoid — two bright layers up at once.
 */
function compositeAt(backdrop: string, phases: readonly FlashPhase[], timeMs: number): string {
  return phases.reduce(
    (under, phase) => composite(under, phase.color, layerOpacityAt(phase, timeMs)),
    backdrop,
  );
}

function peakDelta(backdrop: string, phases: readonly FlashPhase[]): number {
  const base = relativeLuminance(backdrop);
  let worst = 0;
  for (let t = 0; t <= phasesDuration(phases); t += 1) {
    const delta = Math.abs(relativeLuminance(compositeAt(backdrop, phases, t)) - base);
    if (delta > worst) worst = delta;
  }
  return worst;
}

/* WCAG 2.x relative luminance, known values. */
describe('relative luminance', () => {
  it('matches the known ends and midpoint of the WCAG formula', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2158, 3);
  });

  it('composites a layer over a backdrop, so two layers can be measured as one', () => {
    expect(composite('#000000', '#FFFFFF', 1)).toBe('#ffffff');
    expect(composite('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(composite('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(luminanceDelta('#FFFFFF', '#FFFFFF', 1)).toBeCloseTo(0, 5);
  });
});

/* Specification §12 / story 39: the jump stays under 0.1 — below WCAG 2.3.1. */
describe('seam brightness', () => {
  it('keeps every moment of the flash-and-bloom under the threshold', () => {
    for (const backdrop of BACKDROPS) {
      const delta = peakDelta(backdrop, FLASH_PHASES);
      expect(delta, `flash over ${backdrop}`).toBeLessThan(0.1);
      expect(delta, `flash over ${backdrop}`).toBeGreaterThan(0.01); // still a flash
    }
  });

  it('keeps every moment of the mobile dim under the threshold', () => {
    for (const backdrop of BACKDROPS) {
      const delta = peakDelta(backdrop, DIM_PHASES);
      expect(delta, `dim over ${backdrop}`).toBeLessThan(0.1);
      expect(delta, `dim over ${backdrop}`).toBeGreaterThan(0.01);
    }
  });
});

/* R25: "1. вспышка 2. bloom 3. новая секция" — two phases, in that order. */
describe('seam phases', () => {
  const flash = FLASH_PHASES.find((phase) => phase.layer === 'flash')!;
  const bloom = FLASH_PHASES.find((phase) => phase.layer === 'bloom')!;

  it('starts the bloom after the flash has peaked and faded', () => {
    expect(bloom.start).toBeGreaterThan(flash.start + flash.rise); // after the peak
    expect(bloom.start).toBeGreaterThanOrEqual(phaseEnd(flash)); // and after the flash
  });

  it('runs the flash for 160 ms and finishes the whole cover inside the gap', () => {
    expect(phaseEnd(flash)).toBe(flashDuration);
    expect(phasesDuration(FLASH_PHASES)).toBeLessThanOrEqual(FLASH_MIN_GAP_MS);
  });
});

/* Specification §12: 160 ms, no more than one flash per 600 ms (< 3 Hz). */
describe('flash rate limit', () => {
  it('lasts 160 ms and guards a 600 ms gap', () => {
    expect(flashDuration).toBe(160);
    expect(FLASH_MIN_GAP_MS).toBe(600);
  });

  it('refuses a second flash inside the gap and allows one after it', () => {
    const limiter = createFlashLimiter();
    expect(limiter.request(1_000)).toBe(true);
    expect(limiter.request(1_100)).toBe(false);
    expect(limiter.request(1_599)).toBe(false);
    expect(limiter.request(1_600)).toBe(true);
    expect(limiter.request(1_900)).toBe(false);
  });

  it('never allows more than three flashes in any one second', () => {
    const limiter = createFlashLimiter();
    let allowed = 0;
    for (let t = 0; t <= 1_000; t += 50) if (limiter.request(t)) allowed += 1;
    expect(allowed).toBeLessThanOrEqual(3);
  });
});
