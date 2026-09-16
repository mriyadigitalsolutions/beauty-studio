import type { SceneId } from './scene-ids';

/**
 * What a section gets when its scene is built. The section describes what
 * should happen on the timeline; when and how that timeline is driven — pin,
 * scrub, refresh, cleanup — is none of its business (specification §3).
 */
export interface SceneContext {
  /** The element the section attached the scene ref to. */
  root: HTMLElement;
  /** Empty timeline, already bound to the scroll in both directions. */
  timeline: gsap.core.Timeline;
  /** True when the visitor asked for less motion: build the end state only. */
  reducedMotion: boolean;
  /** False below the §10 breakpoint, where the scene is a short reveal. */
  pinned: boolean;
}

export type SceneBuild = (context: SceneContext) => void;

export interface SceneOptions {
  /** Pin the root while the scene plays. True by default, ignored on mobile. */
  pin?: boolean;
  /** Scroll length of the scene in vh — recomputed on every refresh (R24.3). */
  lengthVh?: number;
  /** ScrollTrigger start, default `top top`. */
  start?: string;
  /** Scrub smoothing in seconds; `true` locks the timeline to the scrollbar. */
  scrub?: number | boolean;
}

export interface SceneRegistration {
  id: SceneId;
  element: HTMLElement;
  build: SceneBuild;
  options: SceneOptions;
}

/** Plays one seam flash. Returns nothing; the limiter decides whether it runs. */
export type FlashPlayer = (mode: 'flash' | 'dim') => void;

export interface MotionRuntime {
  readonly reducedMotion: boolean;
  /** Registers a scene and returns its teardown. */
  registerScene(registration: SceneRegistration): () => void;
  /** Registers the overlay that covers one seam; returns its teardown. */
  registerFlash(id: SceneId, play: FlashPlayer): () => void;
  /** Asks for the flash at `id`; refused when it would come too soon (§12). */
  requestFlash(id: SceneId): void;
  /**
   * Page scroll progress, 0..1, pushed from the single scroll loop. Use this
   * instead of creating another ScrollTrigger or another rAF.
   */
  subscribeProgress(listener: (progress: number) => void): () => void;
}
