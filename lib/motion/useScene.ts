'use client';

import { useContext, useEffect, useRef, type RefObject } from 'react';
import { MotionContext } from './MotionProvider';
import type { SceneId } from './scene-ids';
import type { MotionRuntime, SceneBuild, SceneOptions } from './types';

export function useMotionRuntime(): MotionRuntime | null {
  return useContext(MotionContext);
}

/**
 * Registers one step of the film (specification §3, §4). Attach the returned
 * ref to the section root, describe the step on `context.timeline`, and forget
 * about pin, scrub, refresh and cleanup — `MotionProvider` owns all four.
 *
 * `build` is re-read on every render, so it may close over props freely; the
 * scene itself is rebuilt only when `id` or the options change.
 */
export function useScene<T extends HTMLElement = HTMLElement>(
  id: SceneId,
  build: SceneBuild,
  options: SceneOptions = {},
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const runtime = useMotionRuntime();
  const latest = useRef(build);
  latest.current = build;

  const { pin, lengthVh, start, scrub } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || !runtime) return;

    return runtime.registerScene({
      id,
      element,
      build: (context) => latest.current(context),
      options: { pin, lengthVh, start, scrub },
    });
  }, [runtime, id, pin, lengthVh, start, scrub]);

  return ref;
}
