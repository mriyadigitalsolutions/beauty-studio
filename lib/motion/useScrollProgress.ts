'use client';

import { useEffect, useRef } from 'react';
import { useMotionRuntime } from './useScene';

/**
 * Page progress, 0..1, pushed from the one scroll loop. For everything that
 * drifts with the scroll but is not a scene — the background arcs, a progress
 * indicator. Never open a second ScrollTrigger or a second rAF for this.
 */
export function useScrollProgress(onProgress: (progress: number) => void): void {
  const runtime = useMotionRuntime();
  const latest = useRef(onProgress);
  latest.current = onProgress;

  useEffect(() => {
    if (!runtime) return;
    return runtime.subscribeProgress((progress) => latest.current(progress));
  }, [runtime]);
}
