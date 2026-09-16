/*
 * Step 1 of the film, "Hero Fade" (§4): the first screen holds still and its
 * copy melts away — opacity down, blur up, a short drift up. It melts in the
 * reading order, the headline clearing before the subtitle and the pill last,
 * so the screen empties from the top instead of sliding off as one block (R20).
 *
 * The score is data, not a timeline: the order it encodes is what the ticket
 * promises, and it stays readable — and testable — without a browser. The
 * scene in `HeroSection` only plays it back against the scroll.
 */

/** Element of the hero that melts. Each one carries its own `data-` hook. */
export type MeltTarget = 'title' | 'subtitle' | 'cta';

export interface MeltStep {
  readonly target: MeltTarget;
  /** Start of the melt as a share of the scene, 0 at the top of the pin. */
  readonly start: number;
  /** Fully gone by this share of the scene. */
  readonly end: number;
  /** Upward drift at the end, in rem — a hint of movement, not a departure. */
  readonly shiftRem: number;
}

/** How far out of focus a melted element goes. */
export const HERO_MELT_BLUR_PX = 14;

export const HERO_MELT: readonly MeltStep[] = [
  { target: 'title', start: 0, end: 0.42, shiftRem: -1.25 },
  { target: 'subtitle', start: 0.12, end: 0.6, shiftRem: -1 },
  { target: 'cta', start: 0.22, end: 0.72, shiftRem: -0.75 },
];

export function meltStep(target: MeltTarget): MeltStep {
  const step = HERO_MELT.find((candidate) => candidate.target === target);
  if (!step) throw new Error(`no melt step for "${target}"`);
  return step;
}

/** The `data-` attribute the scene finds each melting element by. */
export function meltSelector(target: MeltTarget): string {
  return `[data-hero-melt="${target}"]`;
}
