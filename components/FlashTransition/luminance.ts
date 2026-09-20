/*
 * The flash is measured, not eyeballed. Specification §12 and story 39 cap the
 * jump in relative luminance at 0.1 — below the WCAG 2.3.1 flash threshold —
 * so the peak opacities below are the largest ones that stay under that cap on
 * every page background of palette §14. Change a colour, run the test.
 *
 * The maths itself lives in `lib/color/wcag.ts`, one implementation for the
 * whole repository; this module re-exports it so that the seam published by
 * ticket 02 (`relativeLuminance`, `composite`, `luminanceDelta` from here)
 * keeps working.
 */

export { composite, luminanceDelta, relativeLuminance } from '@/lib/color/wcag';

/** Peak opacity of the white flash layer. */
export const FLASH_PEAK_OPACITY = 0.26;

/** Peak opacity of the soft dim that replaces the flash below the §10 breakpoint. */
export const DIM_PEAK_OPACITY = 0.05;
