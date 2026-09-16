import { describe, expect, it } from 'vitest';
import { SHIN_EDGE } from '@/components/LaserReveal/scene-assets';
import {
  STAGE,
  createHairStrokes,
  maskEdgeY,
  progressAtY,
  shinEdgeX,
  shinPointAt,
} from '@/components/LaserReveal/laser-geometry';

/*
 * The geometry of the scene, checked on its own: the silhouette read off the
 * photograph, where the dissolve edge is at a given scroll progress, where the
 * applicator rides, and the hair strokes that scatter on the edge. The scene
 * itself (pin, loading, fallback) is checked through the page in
 * e2e/laser-reveal.spec.ts — the second seam of §13.
 */

describe('the shin read off the photograph', () => {
  /* Read off public/references/before-after-legs.png by hand: in the prepared
     crop the silhouette leaves the top edge around x = 298 and reaches the
     left edge of the frame around y = 512. The preparation script measures the
     same line and writes it into scene-assets.ts — this checks that what it
     measured is still the leg in that photograph. */
  it('was measured where the leg actually is', () => {
    expect(SHIN_EDGE.x0).toBeCloseTo(298, -1);
    expect(SHIN_EDGE.x0 + SHIN_EDGE.slope * 512).toBeCloseTo(0, -1);
  });

  it('follows the measured line rather than a copy of it', () => {
    for (const y of [0, 180, 512, 719]) {
      expect(shinEdgeX(y)).toBeCloseTo(SHIN_EDGE.x0 + SHIN_EDGE.slope * y, 6);
    }
  });

  it('keeps the applicator on the leg all the way down', () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      const point = shinPointAt(p);
      expect(point.x).toBeGreaterThan(shinEdgeX(point.y));
      expect(point.x).toBeLessThan(STAGE.width);
    }
  });

  it('walks the applicator down and to the left, never back', () => {
    let previous = shinPointAt(0);
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const point = shinPointAt(p);
      expect(point.y).toBeGreaterThan(previous.y);
      expect(point.x).toBeLessThan(previous.x);
      previous = point;
    }
  });
});

describe('the dissolve edge', () => {
  it('starts above the frame and ends below it', () => {
    expect(maskEdgeY(0)).toBeLessThan(0);
    expect(maskEdgeY(1)).toBeGreaterThan(STAGE.height);
  });

  it('only ever moves down, so scrolling back closes the skin again', () => {
    let previous = maskEdgeY(0);
    for (let p = 0.02; p <= 1.0001; p += 0.02) {
      const y = maskEdgeY(p);
      expect(y).toBeGreaterThanOrEqual(previous);
      previous = y;
    }
  });

  it('tells a hair at which progress the edge reaches it', () => {
    for (const p of [0.1, 0.35, 0.5, 0.75]) {
      expect(progressAtY(maskEdgeY(p))).toBeCloseTo(p, 4);
    }
  });
});

describe('the hair layer', () => {
  it('is about 120 short strokes', () => {
    expect(createHairStrokes().length).toBe(120);
  });

  it('is the same every render, and different for another seed', () => {
    expect(createHairStrokes(120, 7)).toEqual(createHairStrokes(120, 7));
    expect(createHairStrokes(120, 7)).not.toEqual(createHairStrokes(120, 8));
  });

  it('puts every stroke on the skin, and keeps it short', () => {
    for (const hair of createHairStrokes()) {
      expect(hair.y).toBeGreaterThanOrEqual(0);
      expect(hair.y).toBeLessThanOrEqual(STAGE.height);
      expect(hair.x).toBeGreaterThan(shinEdgeX(hair.y));
      expect(hair.x).toBeLessThan(STAGE.width);
      expect(hair.length).toBeGreaterThanOrEqual(4);
      expect(hair.length).toBeLessThanOrEqual(18);
    }
  });

  it('covers the whole height, so the edge always has something to scatter', () => {
    const bands = new Set(
      createHairStrokes().map((hair) => Math.floor((hair.y / STAGE.height) * 6)),
    );
    expect(bands.size).toBe(6);
  });

  it('scatters each stroke at the progress where the edge reaches it', () => {
    for (const hair of createHairStrokes()) {
      expect(hair.at).toBeCloseTo(progressAtY(hair.y), 6);
      expect(hair.at).toBeGreaterThanOrEqual(0);
      expect(hair.at).toBeLessThanOrEqual(1);
    }
  });
});
