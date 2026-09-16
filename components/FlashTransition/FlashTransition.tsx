'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useMotionRuntime } from '@/lib/motion/useScene';
import type { SceneId } from '@/lib/motion/scene-ids';
import { DIM_PHASES, FLASH_PHASES, type FlashPhase } from './flash-phases';
import styles from './FlashTransition.module.css';

export { flashDuration } from './flash-limiter';

/**
 * The cover over one seam of the film: a 160 ms flash, then a bloom behind it
 * (R25), played when the scene before it ends. The timing comes from
 * `flash-phases.ts`, which is also what `tests/flash.test.ts` measures — so
 * the brightness the test proves is the brightness the page plays.
 */
export function FlashTransition({ id }: { id: SceneId }) {
  const overlay = useRef<HTMLDivElement | null>(null);
  const flash = useRef<HTMLDivElement | null>(null);
  const dim = useRef<HTMLDivElement | null>(null);
  const bloom = useRef<HTMLDivElement | null>(null);
  const runtime = useMotionRuntime();

  useEffect(() => {
    const root = overlay.current;
    if (!runtime || !root) return;

    const layerNode = (layer: FlashPhase['layer']): HTMLElement | null => {
      if (layer === 'flash') return flash.current;
      if (layer === 'bloom') return bloom.current;
      return dim.current;
    };

    let played = 0;

    const play = (mode: 'flash' | 'dim') => {
      const phases = mode === 'dim' ? DIM_PHASES : FLASH_PHASES;
      const nodes = phases.map((phase) => layerNode(phase.layer)).filter(Boolean) as HTMLElement[];
      if (nodes.length === 0) return;

      gsap.killTweensOf([root, ...nodes]);
      played += 1;
      /* How many times this seam has actually lit up — the only way an e2e can
         count flashes, since a 160 ms peak is not something it can sample. */
      root.dataset.flashCount = String(played);
      root.style.willChange = 'opacity';
      gsap.set(root, { opacity: 1 });
      gsap.set(nodes, { opacity: 0 });

      const timeline = gsap.timeline({
        onComplete: () => {
          gsap.set(root, { opacity: 0 });
          root.style.willChange = ''; // never left hanging (R40)
        },
      });

      for (const phase of phases) {
        const node = layerNode(phase.layer);
        if (!node) continue;
        const at = phase.start / 1000;

        timeline.to(
          node,
          {
            opacity: phase.peak,
            duration: phase.rise / 1000,
            ease: phase.layer === 'bloom' ? 'sine.out' : 'power2.out',
          },
          at,
        );
        timeline.to(
          node,
          {
            opacity: 0,
            duration: phase.fall / 1000,
            ease: phase.layer === 'bloom' ? 'sine.inOut' : 'power2.in',
          },
          at + phase.rise / 1000,
        );

        /* The bloom also breathes outwards — transform only (R39). */
        if (phase.layer === 'bloom') {
          timeline.fromTo(
            node,
            { scale: 0.94 },
            { scale: 1.05, duration: (phase.rise + phase.fall) / 1000, ease: 'sine.out' },
            at,
          );
        }
      }
    };

    const unregister = runtime.registerFlash(id, play);
    return () => {
      unregister();
      const nodes: HTMLElement[] = [root, flash.current, dim.current, bloom.current].filter(
        (node) => node !== null,
      );
      gsap.killTweensOf(nodes);
      for (const node of nodes) node.style.willChange = '';
    };
  }, [runtime, id]);

  return (
    <div ref={overlay} className={styles.overlay} data-flash={id} aria-hidden="true">
      <div ref={bloom} className={styles.bloom} />
      <div ref={flash} className={styles.flash} />
      <div ref={dim} className={styles.dim} />
    </div>
  );
}
