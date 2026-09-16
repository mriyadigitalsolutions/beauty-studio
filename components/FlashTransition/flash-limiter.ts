/*
 * One flash per 600 ms, whatever the scroll does. Scrubbing a trackpad across
 * two seams can ask for flashes faster than 3 Hz, and that is exactly the rate
 * WCAG 2.3.1 forbids — so the limiter, not the caller, decides.
 */

/** Flash length in milliseconds (specification §12). */
export const flashDuration = 160;

/** Shortest gap between two flashes, in milliseconds (specification §12). */
export const FLASH_MIN_GAP_MS = 600;

/** Length of the soft dim that stands in for the flash below the §10 breakpoint. */
export const DIM_DURATION_MS = 180;

export interface FlashLimiter {
  /** True when a flash may start at `now` (a timestamp in ms). */
  request(now: number): boolean;
  reset(): void;
}

export function createFlashLimiter(minGapMs: number = FLASH_MIN_GAP_MS): FlashLimiter {
  let last = Number.NEGATIVE_INFINITY;
  return {
    request(now) {
      if (now - last < minGapMs) return false;
      last = now;
      return true;
    },
    reset() {
      last = Number.NEGATIVE_INFINITY;
    },
  };
}
