import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PETAL_SPRITES, petalSprite } from '@/components/decor/petal-sprites';

/*
 * What the review rejected on the first screen: pale patches of light instead
 * of petals. Three things made them patches — a round silhouette that carried
 * no petal shape at all, blur strong enough to eat what shape there was, and
 * an alpha low enough that rose on a rose card disappeared. All three are
 * measurable, so all three are guarded here.
 *
 * The thresholds sit between what the review turned down (a filled circle,
 * blur 12, alpha 0.72 near and 0.38 far) and what it accepted against
 * docs/reference-hero.png (a tipped silhouette, blur 0.8/3.2/7, alpha
 * 1.0/0.82/0.6), so drifting back towards a glow fails the run.
 */

const SPRITE_BOX = 120; // the sprite viewBox, see petal-sprites.ts

const css = readFileSync(
  new URL('../components/decor/Petals.module.css', import.meta.url),
  'utf8',
);

type Point = readonly [number, number];
type Cubic = readonly [Point, Point, Point, Point];

/** The SVG source baked into a sprite's data URI. */
function spriteSvg(sprite: string): string {
  const match = /^url\("data:image\/svg\+xml,(.*)"\)$/s.exec(sprite);
  if (!match?.[1]) throw new Error('sprite is not an inline svg data uri');
  return decodeURIComponent(match[1]);
}

/** The blur baked into a sprite, in sprite units. */
function spriteBlur(sprite: string): number {
  const match = /stdDeviation="([\d.]+)"/.exec(spriteSvg(sprite));
  if (!match?.[1]) throw new Error('sprite carries no blur');
  return Number.parseFloat(match[1]);
}

/**
 * The outline the sprite paints, as cubic segments.
 *
 * Only the `M`/`C`/`Z` subset is understood, and anything else throws rather
 * than being skipped: a silhouette this test cannot measure must fail loudly,
 * not sail through unmeasured.
 */
function spriteOutline(sprite: string): Cubic[] {
  const svg = spriteSvg(sprite);
  const match = /<path[^>]*\sd="([^"]+)"/.exec(svg);
  if (!match?.[1]) throw new Error('sprite paints no path — a shape cannot be measured');
  const d = match[1];

  const unsupported = d.replace(/[\d.,\s-]/g, '').replace(/[MCZz]/g, '');
  if (unsupported) throw new Error(`path uses unsupported commands: ${unsupported}`);

  const start = /M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(d);
  if (!start?.[1] || !start[2]) throw new Error('path has no start point');

  let cursor: Point = [Number(start[1]), Number(start[2])];
  const segments: Cubic[] = [];
  for (const command of d.matchAll(/C\s*([\d.,\s-]+)/g)) {
    const n = command[1]!.trim().split(/[\s,]+/).map(Number);
    if (n.length % 6 !== 0) throw new Error('C command with a partial coordinate set');
    for (let i = 0; i < n.length; i += 6) {
      const next: Cubic = [
        cursor,
        [n[i]!, n[i + 1]!],
        [n[i + 2]!, n[i + 3]!],
        [n[i + 4]!, n[i + 5]!],
      ];
      segments.push(next);
      cursor = next[3];
    }
  }
  if (segments.length < 2) throw new Error('path is not a closed curved outline');
  return segments;
}

/** Points along the outline, evenly in curve parameter. */
function samples(outline: readonly Cubic[], per = 200): Point[] {
  return outline.flatMap(([p0, p1, p2, p3]) =>
    Array.from({ length: per }, (_, i): Point => {
      const t = i / per;
      const u = 1 - t;
      const w = [u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3];
      return [
        w[0]! * p0[0] + w[1]! * p1[0] + w[2]! * p2[0] + w[3]! * p3[0],
        w[0]! * p0[1] + w[1]! * p1[1] + w[2]! * p2[1] + w[3]! * p3[1],
      ];
    }),
  );
}

/**
 * The turn at every anchor, in degrees: 180 is a seamless join, less is a
 * corner. A circle and a rounded rectangle are 180 all the way round.
 */
function anchorAngles(outline: readonly Cubic[]): number[] {
  return outline.map((segment, i) => {
    const previous = outline[(i - 1 + outline.length) % outline.length]!;
    const incoming: Point = [previous[2][0] - previous[3][0], previous[2][1] - previous[3][1]];
    const outgoing: Point = [segment[1][0] - segment[0][0], segment[1][1] - segment[0][1]];
    const cos =
      (incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) /
      (Math.hypot(...incoming) * Math.hypot(...outgoing));
    return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
  });
}

/** Horizontal extent of the shape in each of ten bands, top band first. */
function widthProfile(points: readonly Point[], bands = 10): number[] {
  const ys = points.map((p) => p[1]);
  const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
  const step = (bottom - top) / bands;
  return Array.from({ length: bands }, (_, k) => {
    const xs = points
      .filter((p) => p[1] >= top + step * k && p[1] <= top + step * (k + 1))
      .map((p) => p[0]);
    return xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  });
}

/** The alpha a depth class paints at. */
function depthOpacity(depth: number): number {
  const match = new RegExp(`\\.depth${depth}\\s*\\{[^}]*opacity:\\s*([\\d.]+)`).exec(css);
  if (!match?.[1]) throw new Error(`no opacity for depth ${depth}`);
  return Number.parseFloat(match[1]);
}

describe('petal silhouette', () => {
  const outline = spriteOutline(petalSprite(0));
  const points = samples(outline);
  const profile = widthProfile(points);
  const widest = Math.max(...profile);

  it('is drawn to a tip, not closed seamlessly like a circle', () => {
    /* One anchor turns hard; a circle or a rounded rectangle turns 180 at all
       of them, so either mutation leaves no corner here. */
    expect(Math.min(...anchorAngles(outline))).toBeLessThanOrEqual(140);
  });

  it('puts that tip at the bottom of the shape', () => {
    const angles = anchorAngles(outline);
    const sharpest = outline[angles.indexOf(Math.min(...angles))]![0];
    const bottom = Math.max(...points.map((p) => p[1]));
    expect(sharpest[1]).toBeGreaterThanOrEqual(bottom - SPRITE_BOX * 0.02);
  });

  it('tapers towards that tip instead of staying round', () => {
    /* Reference petal: the bottom band is under a third of the widest band and
       half the top band. A circle is symmetric (0.60 and 0.60), a rounded
       rectangle barely narrows at all (0.97). */
    expect(profile[9]! / widest).toBeLessThanOrEqual(0.45);
    expect(profile[9]!).toBeLessThanOrEqual(profile[0]! * 0.75);
  });

  it('is taller than it is wide, as a petal is', () => {
    const ys = points.map((p) => p[1]);
    const xs = points.map((p) => p[0]);
    const height = Math.max(...ys) - Math.min(...ys);
    const width = Math.max(...xs) - Math.min(...xs);
    expect(height / width).toBeGreaterThanOrEqual(1.15);
  });

  it('is not a disc: its radius varies round the outline', () => {
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    const radii = points.map((p) => Math.hypot(p[0] - cx, p[1] - cy));
    expect(Math.max(...radii) / Math.min(...radii)).toBeGreaterThanOrEqual(1.35);
  });

  it('draws the same silhouette at every depth', () => {
    const near = JSON.stringify(spriteOutline(petalSprite(0)));
    for (const sprite of PETAL_SPRITES) {
      expect(JSON.stringify(spriteOutline(sprite))).toBe(near);
    }
  });
});

describe('petal depth', () => {
  it('has one sprite per depth, and one depth class per sprite', () => {
    expect(PETAL_SPRITES).toHaveLength(3);
    expect(new Set(PETAL_SPRITES).size).toBe(PETAL_SPRITES.length);
    expect(css.match(/\.depth\d+\s*\{/g)).toHaveLength(PETAL_SPRITES.length);
    PETAL_SPRITES.forEach((sprite, depth) => {
      expect(petalSprite(depth as 0 | 1 | 2)).toBe(sprite);
    });
  });

  it('gets blurrier with distance, never the other way round', () => {
    const [near, mid, far] = PETAL_SPRITES.map(spriteBlur);
    expect(near!).toBeLessThan(mid!);
    expect(mid!).toBeLessThan(far!);
  });

  it('keeps the near plane sharp enough to carry the silhouette', () => {
    /* A Gaussian smears an edge across roughly 2σ; at σ ≤ 1% of the box that
       band is ~2.4 units against a petal 82 units wide — a softened edge, not
       a softened shape, so tip and taper survive in the foreground. */
    expect(spriteBlur(PETAL_SPRITES[0]!)).toBeLessThanOrEqual(SPRITE_BOX / 100);
  });

  it('keeps even the far plane a petal rather than a glow', () => {
    /* Past roughly a twelfth of the sprite box the Gaussian spreads the edge
       across the whole petal and the shape is gone — that was blur 12. */
    expect(spriteBlur(PETAL_SPRITES[2]!)).toBeLessThanOrEqual(SPRITE_BOX / 12);
  });

  it('fades with distance, never the other way round', () => {
    expect(depthOpacity(0)).toBeGreaterThan(depthOpacity(1));
    expect(depthOpacity(1)).toBeGreaterThan(depthOpacity(2));
  });

  it('paints the near plane densely enough to read as a petal', () => {
    expect(depthOpacity(0)).toBeGreaterThanOrEqual(0.9);
  });

  it('keeps colour in the far plane too', () => {
    expect(depthOpacity(2)).toBeGreaterThanOrEqual(0.5);
  });

  it('deepens the page instead of lightening it', () => {
    /* A petal on the reference is darker than the field it lies on; painting
       pale rose over a pale card is exactly the patch of light that failed. */
    expect(css).toMatch(/mix-blend-mode:\s*multiply/);
  });
});
