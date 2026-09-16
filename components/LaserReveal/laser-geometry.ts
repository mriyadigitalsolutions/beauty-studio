/*
 * Where everything sits in the Laser Reveal scene, in the pixel coordinates of
 * the prepared crop (498 × 720, see scripts/prepare-assets.mjs). Both photo
 * layers, the SVG mask, the hair strokes and the applicator share this one
 * coordinate system, so the SVG viewBox is simply `0 0 498 720`.
 *
 * Pure on purpose: this is the part of the scene worth asserting on
 * (tests/laser-reveal.test.ts). Timing and easing live on the GSAP timeline.
 */

import { SCENE_ASPECT_RATIO, LEG_AFTER, SHIN_EDGE } from './scene-assets';

export const STAGE = { width: LEG_AFTER.width, height: LEG_AFTER.height } as const;

/** The dissolve is finished before the scene is: the rest is the settle beat. */
export const REVEAL_END = 0.88;

/**
 * Height of the dissolve band — the edge is a soft ribbon, not a line. Both
 * the gradient that draws it and the timeline that walks it down read it here:
 * two copies of this number quietly change the width of the edge mid-scene.
 */
export const DISSOLVE_BAND = 30;

/* The mask edge starts above the frame and leaves below it, so the first and
   last frames are a whole photograph rather than a half-open one. */
const EDGE_FROM = -60;
const EDGE_TO = STAGE.height + 90;
/** How far below the dissolve edge the applicator rides: it passes first. */
const APPLICATOR_LEAD = 22;
/** How far into the leg from its silhouette the applicator travels. */
const SHIN_INSET = 0.45;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** x of the leg's left silhouette at row `y`; negative once it leaves frame. */
export function shinEdgeX(y: number): number {
  return SHIN_EDGE.x0 + SHIN_EDGE.slope * y;
}

/** Row the dissolve edge has reached at scroll progress `progress`. */
export function maskEdgeY(progress: number): number {
  return EDGE_FROM + clamp01(progress / REVEAL_END) * (EDGE_TO - EDGE_FROM);
}

/** The progress at which the edge reaches row `y` — the inverse of the above. */
export function progressAtY(y: number): number {
  return clamp01(((y - EDGE_FROM) / (EDGE_TO - EDGE_FROM)) * REVEAL_END);
}

export interface ShinPoint {
  x: number;
  y: number;
  /** Tilt of the leg in degrees, so the applicator lies across it. */
  angle: number;
}

/** Where the applicator is at `progress`. It keeps going after the dissolve
 *  has finished, driving off the bottom of the frame during the settle. */
export function shinPointAt(progress: number): ShinPoint {
  const y = EDGE_FROM + APPLICATOR_LEAD + (progress / REVEAL_END) * (EDGE_TO - EDGE_FROM);
  const edge = shinEdgeX(y);
  return {
    x: edge + SHIN_INSET * (STAGE.width - edge),
    y,
    angle: (Math.atan(SHIN_EDGE.slope * (1 - SHIN_INSET)) * 180) / Math.PI,
  };
}

export interface HairStroke {
  id: number;
  x: number;
  y: number;
  /** Direction of the stroke in degrees, roughly along the leg. */
  angle: number;
  length: number;
  /** Where the stroke flies off to when the edge reaches it. */
  driftX: number;
  driftY: number;
  /** Scroll progress at which the dissolve edge arrives at this stroke. */
  at: number;
}

/** Small deterministic PRNG: the same strokes on the server and the client. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HAIR_TOP = 8;
const HAIR_BOTTOM = STAGE.height - 8;
const HAIR_MARGIN = 16;

/**
 * About 120 short strokes standing in for the hair. They are laid out row by
 * row rather than at random, so every part of the dissolve edge has something
 * to scatter, and each one knows the progress at which its turn comes.
 */
export function createHairStrokes(count = 120, seed = 20260916): HairStroke[] {
  const random = mulberry32(seed);
  const strokes: HairStroke[] = [];
  const legTilt = (Math.atan(SHIN_EDGE.slope) * 180) / Math.PI;

  for (let i = 0; i < count; i += 1) {
    const y = Math.round((HAIR_TOP + ((i + random()) / count) * (HAIR_BOTTOM - HAIR_TOP)) * 100) / 100;
    const left = Math.max(shinEdgeX(y) + HAIR_MARGIN, HAIR_MARGIN / 2);
    const right = STAGE.width - HAIR_MARGIN / 2;
    const x = left + random() * (right - left);
    const spread = (random() - 0.5) * 80;
    strokes.push({
      id: i,
      x: Math.round(x * 100) / 100,
      y,
      angle: Math.round((legTilt + spread) * 100) / 100,
      length: Math.round((5 + random() * 10) * 100) / 100,
      driftX: Math.round((random() - 0.35) * 46 * 100) / 100,
      driftY: Math.round(-(12 + random() * 26) * 100) / 100,
      at: progressAtY(y),
    });
  }
  return strokes;
}

/** The one set of strokes the scene draws and the timeline animates. */
export const HAIR_STROKES: readonly HairStroke[] = createHairStrokes();

export { SCENE_ASPECT_RATIO, SHIN_EDGE };
