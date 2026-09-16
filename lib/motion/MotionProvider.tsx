'use client';

import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Arcs } from '@/components/decor/Arcs';
import { Petals } from '@/components/decor/Petals';
import { FlashTransition } from '@/components/FlashTransition/FlashTransition';
import { createFlashLimiter } from '@/components/FlashTransition/flash-limiter';
import { FLASH_SCENE_IDS, flashAfter, type SceneId } from './scene-ids';
import { SceneFixture } from './SceneFixture';
import type { FlashPlayer, MotionRuntime, SceneOptions, SceneRegistration } from './types';

/*
 * One owner for the whole scroll (specification §2, §3):
 *
 *  - one rAF loop — Lenis is driven by the GSAP ticker and by nothing else;
 *  - one place that creates ScrollTriggers, one that refreshes them on resize
 *    with a debounce, one that kills them on unmount;
 *  - one place that decides whether the film plays at all (reduced motion) and
 *    whether it pins (the §10 breakpoint).
 *
 * A section only says "here is my element and here is my timeline".
 */

const DESKTOP_SCENARIO = '(min-width: 1024px) and (pointer: fine)';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const RESIZE_DEBOUNCE_MS = 200;
const SCROLL_MEMORY_KEY = 'motion:scroll';
const WILL_CHANGE = 'transform, opacity, filter';

/* Lenis' own stylesheet, inlined so the rules ship with the provider rather
   than leaking into the globals another ticket owns. React 19 hoists it. */
const LENIS_CSS = `
html.lenis,html.lenis body{height:auto}
.lenis.lenis-smooth{scroll-behavior:auto!important}
.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}
.lenis.lenis-stopped{overflow:hidden}
.lenis.lenis-smooth iframe{pointer-events:none}
`;

export const MotionContext = createContext<MotionRuntime | null>(null);

function matches(query: string): boolean {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

function readScrollMemory(): number {
  try {
    const raw = window.sessionStorage.getItem(SCROLL_MEMORY_KEY);
    const value = raw === null ? 0 : Number.parseFloat(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0; // private mode, blocked storage — restoring is a nicety.
  }
}

function writeScrollMemory(value: number): void {
  try {
    window.sessionStorage.setItem(SCROLL_MEMORY_KEY, String(Math.round(value)));
  } catch {
    /* ignore */
  }
}

export function MotionProvider({ children }: { children: ReactNode }) {
  /* The runtime object is stable for the life of the provider: sections
     register against it in their own effects, which run before ours. */
  /* A set, not a map keyed by id: step 9 of §4 ("Cards") is carried by two
     sections at once, and a map would let the second one silently evict the
     first — one of the two would quietly stop pinning. Every registration is
     its own entry with its own trigger and its own teardown. */
  const scenes = useRef(new Set<{ registration: SceneRegistration; kill: (() => void) | null }>());
  const flashes = useRef(new Map<SceneId, FlashPlayer>());
  const listeners = useRef(new Set<(progress: number) => void>());
  const limiter = useRef(createFlashLimiter());
  const buildScene = useRef<((registration: SceneRegistration) => (() => void) | null) | null>(null);
  const dimMode = useRef(false);
  const runtime = useRef<MotionRuntime | null>(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  if (runtime.current === null) {
    runtime.current = {
      get reducedMotion() {
        return matches(REDUCED_MOTION);
      },
      registerScene(registration) {
        const entry = { registration, kill: null as (() => void) | null };
        scenes.current.add(entry);
        if (buildScene.current) entry.kill = buildScene.current(registration);
        return () => {
          entry.kill?.();
          entry.kill = null;
          scenes.current.delete(entry);
        };
      },
      registerFlash(id, play) {
        flashes.current.set(id, play);
        return () => {
          flashes.current.delete(id);
        };
      },
      requestFlash(id) {
        const play = flashes.current.get(id);
        if (!play) return;
        if (!limiter.current.request(performance.now())) return;
        play(dimMode.current ? 'dim' : 'flash');
      },
      subscribeProgress(listener) {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
    };
  }

  useEffect(() => {
    const reduceQuery = window.matchMedia(REDUCED_MOTION);
    const desktopQuery = window.matchMedia(DESKTOP_SCENARIO);

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;
    let resizeTimer: number | undefined;
    let savedScrollAt = 0;
    let disposed = false;

    gsap.registerPlugin(ScrollTrigger);
    /* Resize is ours, debounced; the rest of the auto-refresh events stay. */
    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });

    const setup = () => {
      const reduce = reduceQuery.matches;
      const pinAllowed = desktopQuery.matches && !reduce;
      dimMode.current = !desktopQuery.matches;
      setReducedMotion(reduce);
      document.documentElement.dataset.motion = reduce ? 'reduced' : 'full';

      /* --- the single scroll loop ------------------------------------- */
      if (!reduce) {
        lenis = new Lenis({
          autoRaf: false, // the GSAP ticker owns the only rAF of the site (R41)
          lerp: 0.1,
          smoothWheel: true,
          anchors: true, // keeps `#`-links working under smooth scroll (R11.1)
        });
        lenis.on('scroll', ScrollTrigger.update);
        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      /* --- scene creation, one place ----------------------------------- */
      const create = (registration: SceneRegistration): (() => void) | null => {
        const { id, element, build, options } = registration;
        const timeline = gsap.timeline({ paused: true });
        element.dataset.scene = id;
        /* Which of the sections sharing this id this one is — 0 unless a step
           carries several, as step 9 does. */
        const part = [...scenes.current]
          .filter((entry) => entry.registration.id === id)
          .findIndex((entry) => entry.registration === registration);
        element.dataset.scenePart = String(Math.max(part, 0));

        build({ root: element, timeline, reducedMotion: reduce, pinned: pinAllowed });

        if (reduce) {
          /* Everything is handed over in its end state: no pin, no scrub,
             no movement, all content on screen (story 22). */
          timeline.progress(1).pause();
          delete element.dataset.scenePinned;
          return () => {
            timeline.kill();
          };
        }

        const options_: Required<Pick<SceneOptions, 'lengthVh' | 'start' | 'scrub'>> & {
          pin: boolean;
        } = {
          lengthVh: options.lengthVh ?? 100,
          start: options.start ?? 'top top',
          scrub: options.scrub ?? true,
          pin: (options.pin ?? true) && pinAllowed,
        };
        const seam = flashAfter(id);

        /*
         * A step carried by several sections (step 9 of §4) still owns exactly
         * one seam, and that seam is at the end of the whole step — not at the
         * join between its sub-scenes. So only the last registration of the id
         * asks for the flash going down, and only the first one going back up;
         * the others cross their own joins silently. Membership is read when
         * the trigger fires, so a section mounting later still shifts who owns
         * the seam. The 600 ms limiter cannot help here: the sub-scenes are
         * whole screens apart.
         */
        const ownsSeam = (edge: 'leave' | 'enterBack'): boolean => {
          const parts = [...scenes.current]
            .filter((entry) => entry.registration.id === id)
            .map((entry) => entry.registration);
          const owner = edge === 'leave' ? parts[parts.length - 1] : parts[0];
          return owner === undefined || owner === registration;
        };

        const trigger = ScrollTrigger.create({
          trigger: element,
          start: options_.start,
          /* Read on every refresh, so rotation and resize keep the scene the
             same number of screen heights long (R24.3). */
          end: () => `+=${Math.round((window.innerHeight * options_.lengthVh) / 100)}`,
          scrub: options_.scrub, // scrubs both ways: back up plays it back (R24.1)
          pin: options_.pin ? element : false,
          pinSpacing: options_.pin,
          anticipatePin: options_.pin ? 1 : 0,
          invalidateOnRefresh: true,
          animation: timeline,
          onToggle: (self) => {
            /* will-change only while the scene is on screen (R40). */
            element.style.willChange = self.isActive ? WILL_CHANGE : '';
          },
          onLeave: () => {
            if (seam && ownsSeam('leave')) runtime.current?.requestFlash(seam);
          },
          onEnterBack: () => {
            if (seam && ownsSeam('enterBack')) runtime.current?.requestFlash(seam);
          },
        });

        if (options_.pin) element.dataset.scenePinned = 'true';

        return () => {
          trigger.kill();
          timeline.kill();
          element.style.willChange = '';
          delete element.dataset.scenePinned;
          delete element.dataset.scenePart;
        };
      };

      buildScene.current = create;
      for (const entry of scenes.current.values()) {
        entry.kill?.();
        entry.kill = create(entry.registration);
      }

      /* --- progress for the decor, from the one loop ------------------- */
      const progressTrigger = reduce
        ? null
        : ScrollTrigger.create({
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
              for (const listener of listeners.current) listener(self.progress);
            },
          });

      /* --- resize / rotation, debounced -------------------------------- */
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), RESIZE_DEBOUNCE_MS);
      };
      window.addEventListener('resize', onResize, { passive: true });
      window.addEventListener('orientationchange', onResize, { passive: true });

      /* --- reload in the middle of a scene ----------------------------- */
      const remember = () => {
        const now = performance.now();
        if (now - savedScrollAt < 200) return;
        savedScrollAt = now;
        writeScrollMemory(window.scrollY);
      };
      window.addEventListener('scroll', remember, { passive: true });

      const saved = readScrollMemory();
      const restore = () => {
        if (disposed) return;
        ScrollTrigger.refresh();
        if (saved > 0) {
          if (lenis) lenis.scrollTo(saved, { immediate: true, force: true });
          else window.scrollTo(0, saved);
          ScrollTrigger.refresh();
        }
      };
      if (document.readyState === 'complete') restore();
      else window.addEventListener('load', restore, { once: true });
      document.fonts?.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });

      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        window.removeEventListener('scroll', remember);
        window.removeEventListener('load', restore);
        window.clearTimeout(resizeTimer);
        progressTrigger?.kill();
        buildScene.current = null;
        for (const entry of scenes.current.values()) {
          entry.kill?.();
          entry.kill = null;
        }
        if (tick) gsap.ticker.remove(tick);
        tick = null;
        lenis?.destroy();
        lenis = null;
      };
    };

    /* The browser restores the old offset before the pins exist; we measure
       first and put the visitor back ourselves (R24.2). */
    const previousRestoration = history.scrollRestoration;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    let teardown = setup();

    /* Toggling the OS switch or moving between the two scenarios rebuilds the
       whole film rather than leaving half of it pinned. */
    const rebuild = () => {
      teardown();
      teardown = setup();
    };
    reduceQuery.addEventListener('change', rebuild);
    desktopQuery.addEventListener('change', rebuild);

    return () => {
      disposed = true;
      reduceQuery.removeEventListener('change', rebuild);
      desktopQuery.removeEventListener('change', rebuild);
      teardown();
      gsap.ticker.lagSmoothing(500, 33);
      if ('scrollRestoration' in history) history.scrollRestoration = previousRestoration;
      delete document.documentElement.dataset.motion;
    };
  }, []);

  return (
    <MotionContext.Provider value={runtime.current}>
      <style href="lenis" precedence="default">
        {LENIS_CSS}
      </style>
      <Arcs />
      <Petals />
      {children}
      {/* Development only: compiled out of the static export (see SceneFixture). */}
      {process.env.NODE_ENV !== 'production' && <SceneFixture />}
      {!reducedMotion && FLASH_SCENE_IDS.map((id) => <FlashTransition key={id} id={id} />)}
    </MotionContext.Provider>
  );
}
