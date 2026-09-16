/*
 * The assembled film: where the thirteen steps of §4 actually land on the
 * page, and what the §10 scenario changes about them.
 *
 * `scene-ids.ts` says what the steps are and in which order they play.
 * This module says where a visitor can be taken to see them — seven stops,
 * because two pairs of steps share one section — and it is the only place
 * that knows an anchor string. The header menu, the side indicator and the
 * scroll runtime all read the same table, so a section renamed in one place
 * cannot drift out of the other two.
 *
 * Dependency-free on purpose (as `scene-ids.ts` is): it is read by the GSAP
 * runtime, by a Framer Motion menu and by unit tests alike.
 */

import { SCENE_IDS, type RegisterableSceneId, type SceneId } from './scene-ids';

/** §10 — the one decision breakpoint of the whole project. */
export const DESKTOP_SCENARIO = '(min-width: 1024px) and (pointer: fine)';

/** The nav-dictionary keys that name a stop (`dictionary.nav.items`). */
export type FilmStopKey =
  | 'hero'
  | 'laserReveal'
  | 'skinLayers'
  | 'howItWorks'
  | 'benefits'
  | 'stats'
  | 'cta';

export interface FilmStop {
  /** The step of §4 this stop shows — the one that owns the pin there. */
  id: SceneId;
  /** `id` of the section element on the page, without the `#`. */
  anchor: string;
  /** Key into `dictionary.nav.items` for the visible label. */
  key: FilmStopKey;
}

/**
 * Scroll order, top to bottom. Hero carries steps 1–2 and Laser Reveal steps
 * 4–5, so each of those pairs is one stop, named by the step that pins.
 * Step 9 (`cards`) is the other way round: one step drawn as two sections,
 * and a visitor expects to reach both.
 */
export const FILM_STOPS: readonly FilmStop[] = [
  { id: SCENE_IDS.pinHero, anchor: 'hero', key: 'hero' },
  { id: SCENE_IDS.handReveal, anchor: 'laser-reveal', key: 'laserReveal' },
  { id: SCENE_IDS.skinLayers, anchor: 'skin-layers', key: 'skinLayers' },
  { id: SCENE_IDS.cards, anchor: 'how-it-works', key: 'howItWorks' },
  { id: SCENE_IDS.cards, anchor: 'benefits', key: 'benefits' },
  { id: SCENE_IDS.counter, anchor: 'stats', key: 'stats' },
  { id: SCENE_IDS.cta, anchor: 'cta', key: 'cta' },
];

/** The anchors of the stops, in scroll order. */
export function stopAnchors(): readonly string[] {
  return FILM_STOPS.map((stop) => stop.anchor);
}

/**
 * §10: below the breakpoint Laser Reveal stays — it is the core of the story —
 * but takes half the scroll to play, because without a pin its height is what
 * the visitor has to travel past.
 */
export const MOBILE_SCENE_SCALE = 0.5;

const SHORTENED_BELOW_BREAKPOINT: readonly RegisterableSceneId[] = [
  SCENE_IDS.handReveal,
  SCENE_IDS.hairDissolve,
];

/** How a scene is driven in the scenario now in force. */
export type ScenePlayback = 'scrub' | 'reveal';

/*
 * §10 again: below the breakpoint a scene is "a short reveal on entering the
 * screen" instead of a timeline scrubbed over its own height. Without a pin,
 * scrubbing means the section arrives on screen at progress 0 — which is how
 * the closing CTA came in blank and only appeared a screen later.
 *
 * Two steps stay on the scroll. Laser Reveal is the story itself and §10 keeps
 * it, at half the height. Hero's two steps are not an appearance but a melt:
 * played on entry they would wipe the first screen the moment it arrives.
 */
const SCRUBBED_BELOW_BREAKPOINT: readonly RegisterableSceneId[] = [
  SCENE_IDS.heroFade,
  SCENE_IDS.pinHero,
  SCENE_IDS.handReveal,
  SCENE_IDS.hairDissolve,
];

export function scenarioPlayback(id: RegisterableSceneId, desktop: boolean): ScenePlayback {
  if (desktop || SCRUBBED_BELOW_BREAKPOINT.includes(id)) return 'scrub';
  return 'reveal';
}

/**
 * How many screen heights a scene occupies in the scenario now in force. The
 * scenario never invents a length: it takes the one the section asked for and
 * either leaves it alone or halves it (§10).
 */
export function scenarioLengthVh(
  id: RegisterableSceneId,
  lengthVh: number,
  desktop: boolean,
): number {
  if (desktop || !SHORTENED_BELOW_BREAKPOINT.includes(id)) return lengthVh;
  return lengthVh * MOBILE_SCENE_SCALE;
}
