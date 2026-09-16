import { describe, expect, it } from 'vitest';
import {
  FLASH_MIN_GAP_MS,
  flashDuration,
  createFlashLimiter,
} from '@/components/FlashTransition/flash-limiter';
import {
  DIM_PEAK_OPACITY,
  FLASH_PEAK_OPACITY,
  luminanceDelta,
  relativeLuminance,
} from '@/components/FlashTransition/luminance';

/* Page backgrounds a flash can sit on — palette §14 minus --ink, which is text. */
const BACKDROPS = ['#F7E7DF', '#F2D3D8', '#E4D0F3', '#E8D8CF'];

/* WCAG 2.x relative luminance, known values. */
describe('relative luminance', () => {
  it('matches the known ends and midpoint of the WCAG formula', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    expect(relativeLuminance('#808080')).toBeCloseTo(0.2158, 3);
  });
});

/* Specification §12 / story 39: the jump stays under 0.1 — below WCAG 2.3.1. */
describe('flash brightness', () => {
  it('keeps the flash under the photosensitivity threshold on every backdrop', () => {
    for (const backdrop of BACKDROPS) {
      const delta = luminanceDelta(backdrop, '#FFFFFF', FLASH_PEAK_OPACITY);
      expect(delta).toBeLessThan(0.1);
      expect(delta).toBeGreaterThan(0.01); // still a flash, not a no-op
    }
  });

  it('keeps the mobile dim under the same threshold', () => {
    for (const backdrop of BACKDROPS) {
      const delta = luminanceDelta(backdrop, '#2C2326', DIM_PEAK_OPACITY);
      expect(delta).toBeLessThan(0.1);
      expect(delta).toBeGreaterThan(0.01);
    }
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
