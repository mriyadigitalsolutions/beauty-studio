import { describe, expect, it } from 'vitest';
import {
  FLASH_SCENE_IDS,
  OFFSTAGE_SCENE_IDS,
  SCENE_IDS,
  SCENE_SEQUENCE,
  isFlashScene,
  isOffstageSceneId,
  isSceneId,
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

  it('keeps the offstage ids out of the film', () => {
    /* The development fixture registers offstage so that the film's own count
       of steps and flashes cannot be moved by a test double. */
    for (const id of Object.values(OFFSTAGE_SCENE_IDS)) {
      expect(SCENE_SEQUENCE).not.toContain(id);
      expect(FLASH_SCENE_IDS).not.toContain(id);
      expect(isSceneId(id)).toBe(false);
      expect(isOffstageSceneId(id)).toBe(true);
    }
    expect(SCENE_SEQUENCE.every((id) => !isOffstageSceneId(id))).toBe(true);
  });

  it('knows which step follows a given one, and that the film ends at the CTA', () => {
    expect(nextSceneId('pin-hero')).toBe('flash-hero-to-laser');
    expect(nextSceneId('cta')).toBeNull();
  });
});
