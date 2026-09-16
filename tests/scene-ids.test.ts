import { describe, expect, it } from 'vitest';
import {
  FLASH_SCENE_IDS,
  SCENE_IDS,
  SCENE_SEQUENCE,
  isFlashScene,
  nextSceneId,
} from '@/lib/motion/scene-ids';

/*
 * The expected order is transcribed from specification §4 ("Порядок сцен —
 * ровно план брифа"), not derived from the module under test.
 */
const STEPS_FROM_SPEC = [
  'hero-fade',
  'pin-hero',
  'flash-hero-to-laser',
  'hand-reveal',
  'hair-dissolve',
  'flash-laser-to-skin',
  'skin-layers',
  'flash-skin-to-cards',
  'cards',
  'flash-cards-to-counter',
  'counter',
  'flash-counter-to-cta',
  'cta',
];

describe('scene registry', () => {
  it('holds the thirteen steps of §4 in order and nothing else', () => {
    expect(SCENE_SEQUENCE).toEqual(STEPS_FROM_SPEC);
    expect(Object.values(SCENE_IDS).sort()).toEqual([...STEPS_FROM_SPEC].sort());
  });

  it('has no duplicate id', () => {
    expect(new Set(SCENE_SEQUENCE).size).toBe(13);
  });

  it('counts exactly the five flashes of the plan', () => {
    expect(FLASH_SCENE_IDS).toEqual([
      'flash-hero-to-laser',
      'flash-laser-to-skin',
      'flash-skin-to-cards',
      'flash-cards-to-counter',
      'flash-counter-to-cta',
    ]);
    expect(SCENE_SEQUENCE.filter(isFlashScene)).toHaveLength(5);
  });

  it('knows which step follows a given one, and that the film ends at the CTA', () => {
    expect(nextSceneId('pin-hero')).toBe('flash-hero-to-laser');
    expect(nextSceneId('cta')).toBeNull();
  });
});
