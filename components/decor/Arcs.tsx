'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe';
import { useScrollProgress } from '@/lib/motion/useScrollProgress';
import styles from './Arcs.module.css';

/*
 * Five hairline arcs on the page field (story 3d). They drift very slowly with
 * the scroll — driven by the progress the motion runtime already computes, not
 * by a ScrollTrigger of their own — and stand perfectly still when the visitor
 * asked for less motion.
 */

interface Arc {
  d: string;
  className?: string;
  /** How far this arc travels over the whole page, in viewBox units. */
  travel: number;
}

const ARCS: readonly Arc[] = [
  { d: 'M-120 620 C 120 300 420 160 760 140 C 1100 120 1340 220 1520 420', travel: -70 },
  { d: 'M-80 880 C 180 640 460 520 800 520 C 1140 520 1380 640 1560 860', travel: 48, className: 'arcSoft' },
  { d: 'M-140 260 C 140 60 480 -20 820 40 C 1120 92 1360 240 1540 470', travel: -32, className: 'arcTint' },
  { d: 'M-100 1120 C 200 960 520 900 860 940 C 1160 976 1380 1080 1540 1240', travel: 64, className: 'arcSoft' },
  { d: 'M-160 420 C 60 220 340 120 700 120 C 1060 120 1340 260 1560 560', travel: -52 },
];

export function Arcs() {
  const layer = useRef<HTMLDivElement | null>(null);
  const drift = useRef<((progress: number) => void) | null>(null);
  const reducedMotion = useReducedMotionSafe();

  useEffect(() => {
    const root = layer.current;
    if (!root || reducedMotion) return;

    const context = gsap.context(() => {
      const groups = gsap.utils.toArray<SVGGElement>(`.${styles.group}`);
      const setters = groups.map((group) =>
        gsap.quickTo(group, 'y', { duration: 1.1, ease: 'power2.out' }),
      );
      const travels = groups.map((group) => Number(group.dataset.travel ?? 0));

      drift.current = (progress: number) => {
        setters.forEach((set, index) => set((travels[index] ?? 0) * progress));
      };
    }, root);

    return () => {
      drift.current = null;
      context.revert();
    };
  }, [reducedMotion]);

  useScrollProgress((progress) => drift.current?.(progress));

  return (
    <div ref={layer} className={styles.layer} aria-hidden="true" data-decor="arcs">
      <svg
        className={styles.svg}
        viewBox="0 0 1440 1280"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {ARCS.map((arc) => (
          <g key={arc.d} className={styles.group} data-travel={arc.travel}>
            <path
              className={`${styles.arc} ${(arc.className ? styles[arc.className] : '') ?? ''}`}
              d={arc.d}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
