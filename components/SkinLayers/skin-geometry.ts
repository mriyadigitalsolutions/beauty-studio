/**
 * The cross-section, as numbers. Kept out of the component so the palette
 * roles of §14 and the depth the beam reaches can be asserted without
 * rendering anything.
 *
 * Units are viewBox units of `VIEW_BOX`; the drawing is schematic and says so
 * in its caption — real layers are nowhere near these proportions.
 */

export const VIEW_BOX = { width: 420, height: 340 } as const;

export type SkinLayerId = 'epidermis' | 'dermis' | 'subcutis' | 'follicle';

export interface SkinLayer {
  id: SkinLayerId;
  /** Palette token of §14 — never a hex literal. */
  token: '--peach' | '--rose' | '--sand' | '--lilac';
  /** Top edge and height of the band this layer occupies. */
  y: number;
  height: number;
  /** How far the layer drifts apart while the scene scrubs (story 10). */
  spread: number;
}

export const SKIN_LAYERS: readonly SkinLayer[] = [
  { id: 'epidermis', token: '--peach', y: 40, height: 44, spread: -30 },
  { id: 'dermis', token: '--rose', y: 92, height: 92, spread: -8 },
  { id: 'subcutis', token: '--sand', y: 192, height: 104, spread: 26 },
  /* The follicle is drawn as a shaft crossing all three bands, so its own
     band spans them; its root is FOLLICLE_BULB. */
  { id: 'follicle', token: '--lilac', y: 40, height: 256, spread: 6 },
];

/** The root of the hair: what the pulse is aimed at. */
export const FOLLICLE_BULB = { x: 268, y: 244, r: 22 } as const;

/** Where the shaft of the follicle runs, from the surface down to the bulb. */
export const FOLLICLE_SHAFT = { x: 268, topY: 18, bottomY: FOLLICLE_BULB.y } as const;

/** The laser pulse: it starts above the skin and stops inside the root. */
export const BEAM = {
  token: '--lilac',
  x: 268,
  startY: 0,
  endY: FOLLICLE_BULB.y,
} as const;

/** Where a layer's label sits; the leader line runs from the band to it. */
export const LABEL_X = 26;
