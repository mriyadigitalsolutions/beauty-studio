/*
 * The shape of one seam cover in time — the brief's "1. вспышка 2. bloom
 * 3. новая секция" (R25). The two phases do not overlap: the bloom starts
 * where the flash ends, so what the eye gets is a hard light followed by a
 * soft halo, and so the brightness of the seam can be measured phase by phase
 * instead of guessed at (R25.1).
 *
 * This table is the single source of the timing: `FlashTransition` builds its
 * GSAP timeline from it and `tests/flash.test.ts` measures the same table.
 */

import { DIM_PEAK_OPACITY, FLASH_PEAK_OPACITY } from './luminance';
import { DIM_DURATION_MS, flashDuration } from './flash-limiter';

/** Peak of the halo. Softer than the flash — it is an afterglow, not a second flash. */
export const BLOOM_PEAK_OPACITY = 0.22;

export interface FlashPhase {
  /** Which layer of the overlay this phase drives. */
  layer: 'flash' | 'bloom' | 'dim';
  /** Colour of that layer at full opacity, as the brightness test sees it. */
  color: string;
  /** Milliseconds from the start of the seam cover. */
  start: number;
  /** Milliseconds spent rising to `peak`, then falling back to zero. */
  rise: number;
  fall: number;
  peak: number;
}

/** Above the §10 breakpoint: flash, then bloom. */
export const FLASH_PHASES: readonly FlashPhase[] = [
  { layer: 'flash', color: '#FFFFFF', start: 0, rise: 56, fall: 104, peak: FLASH_PEAK_OPACITY },
  {
    layer: 'bloom',
    color: '#FFFFFF',
    start: flashDuration, // the halo begins where the flash ends, never under it
    rise: 150,
    fall: 250,
    peak: BLOOM_PEAK_OPACITY,
  },
];

/** Below the breakpoint the flash becomes a soft dim (§10). */
export const DIM_PHASES: readonly FlashPhase[] = [
  {
    layer: 'dim',
    color: '#2C2326',
    start: 0,
    rise: DIM_DURATION_MS * 0.35,
    fall: DIM_DURATION_MS * 0.65,
    peak: DIM_PEAK_OPACITY,
  },
];

export function phaseEnd(phase: FlashPhase): number {
  return phase.start + phase.rise + phase.fall;
}

/** When the whole cover is over, in milliseconds. */
export function phasesDuration(phases: readonly FlashPhase[]): number {
  return phases.reduce((end, phase) => Math.max(end, phaseEnd(phase)), 0);
}

/**
 * Upper bound of a layer's opacity at `timeMs`: `peak` for the whole phase,
 * zero outside it. Deliberately pessimistic — it does not care which easing
 * the timeline uses, so the measurement cannot be undone by a tweak to a curve.
 */
export function layerOpacityAt(phase: FlashPhase, timeMs: number): number {
  return timeMs >= phase.start && timeMs < phaseEnd(phase) ? phase.peak : 0;
}
