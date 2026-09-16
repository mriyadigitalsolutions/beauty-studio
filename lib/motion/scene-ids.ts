/*
 * The thirteen steps of the film, specification §4, in the order the brief
 * lists them. Every section takes its id from here — a section that invents
 * its own string drops out of the sequence and the flashes stop lining up.
 *
 * This module is deliberately dependency-free: it is the shared vocabulary of
 * the scroll, not part of the GSAP runtime.
 */

export const SCENE_IDS = {
  /** 1 — hero copy melts: opacity + blur + y. */
  heroFade: 'hero-fade',
  /** 2 — hero card pinned, petals drift into depth. */
  pinHero: 'pin-hero',
  /** 3 — flash + bloom. */
  flashHeroToLaser: 'flash-hero-to-laser',
  /** 4 — the applicator hand travels down the shin. */
  handReveal: 'hand-reveal',
  /** 5 — the mask opens smooth skin, hairs scatter. */
  hairDissolve: 'hair-dissolve',
  /** 6 — flash. */
  flashLaserToSkin: 'flash-laser-to-skin',
  /** 7 — the skin cross-section separates, the beam reaches the follicle. */
  skinLayers: 'skin-layers',
  /** 8 — flash. */
  flashSkinToCards: 'flash-skin-to-cards',
  /** 9 — both card sections: How It Works, then Benefits. */
  cards: 'cards',
  /** 10 — flash. */
  flashCardsToCounter: 'flash-cards-to-counter',
  /** 11 — the counters run up. */
  counter: 'counter',
  /** 12 — flash. */
  flashCounterToCta: 'flash-counter-to-cta',
  /** 13 — the closing booking screen. */
  cta: 'cta',
} as const;

export type SceneId = (typeof SCENE_IDS)[keyof typeof SCENE_IDS];

/** The plan of §4 read top to bottom. Scroll order, not registration order. */
export const SCENE_SEQUENCE: readonly SceneId[] = [
  SCENE_IDS.heroFade,
  SCENE_IDS.pinHero,
  SCENE_IDS.flashHeroToLaser,
  SCENE_IDS.handReveal,
  SCENE_IDS.hairDissolve,
  SCENE_IDS.flashLaserToSkin,
  SCENE_IDS.skinLayers,
  SCENE_IDS.flashSkinToCards,
  SCENE_IDS.cards,
  SCENE_IDS.flashCardsToCounter,
  SCENE_IDS.counter,
  SCENE_IDS.flashCounterToCta,
  SCENE_IDS.cta,
];

/** The five seams. A flash lives at the end of the pin before it. */
export const FLASH_SCENE_IDS: readonly SceneId[] = SCENE_SEQUENCE.filter((id) =>
  id.startsWith('flash-'),
);

export type FlashSceneId = (typeof FLASH_SCENE_IDS)[number];

export function isSceneId(value: string): value is SceneId {
  return (SCENE_SEQUENCE as readonly string[]).includes(value);
}

export function isFlashScene(id: SceneId): boolean {
  return id.startsWith('flash-');
}

/** The step that follows `id` in the film, or null at the closing screen. */
export function nextSceneId(id: SceneId): SceneId | null {
  const index = SCENE_SEQUENCE.indexOf(id);
  if (index < 0) return null;
  return SCENE_SEQUENCE[index + 1] ?? null;
}

/** The seam right after `id`, when there is one — used to fire its flash. */
export function flashAfter(id: SceneId): SceneId | null {
  const next = nextSceneId(id);
  return next !== null && isFlashScene(next) ? next : null;
}
