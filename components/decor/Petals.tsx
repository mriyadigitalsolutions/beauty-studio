'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe';
import { useScrollProgress } from '@/lib/motion/useScrollProgress';
import { petalSprite, type PetalDepth } from './petal-sprites';
import styles from './Petals.module.css';

/*
 * Nine petals in three depths, some of them hanging past the edge of the card
 * exactly as in the reference (story 4). Positions are a fixed table, not
 * random: a random layout would differ between server and client markup, and
 * the layer would jump on hydration.
 */
interface PetalSpec {
  /** Percentages of the viewport — negative values hang past the edge. */
  x: number;
  y: number;
  /** Size in vmin — the near plane is small and sharp, the far plane wide. */
  size: number;
  depth: PetalDepth;
  turn: number;
  /** Seconds of one float cycle, and how far it drifts, in percent of itself. */
  cycle: number;
  driftX: number;
  driftY: number;
  /** Hidden below the §10 breakpoint, halving the count on small screens. */
  optional?: boolean;
}

const PETALS: readonly PetalSpec[] = [
  { x: -3, y: 12, size: 15, depth: 2, turn: -24, cycle: 19, driftX: 4, driftY: -6 },
  { x: 13, y: 62, size: 6, depth: 0, turn: 38, cycle: 13, driftX: -5, driftY: -8 },
  { x: 27, y: 19, size: 9, depth: 1, turn: 112, cycle: 16, driftX: 6, driftY: 5, optional: true },
  { x: 45, y: 88, size: 12, depth: 2, turn: -64, cycle: 22, driftX: -4, driftY: -5 },
  { x: 57, y: 33, size: 4.5, depth: 0, turn: 16, cycle: 11, driftX: 7, driftY: 6, optional: true },
  { x: 74, y: 70, size: 10, depth: 1, turn: -132, cycle: 18, driftX: -6, driftY: 4 },
  { x: 86, y: 14, size: 5.5, depth: 0, turn: 74, cycle: 15, driftX: 5, driftY: 7, optional: true },
  { x: 97, y: 50, size: 16, depth: 2, turn: 148, cycle: 24, driftX: -3, driftY: -4 },
  { x: 35, y: 46, size: 7, depth: 1, turn: -96, cycle: 17, driftX: 4, driftY: -7, optional: true },
];

export function Petals({ count = PETALS.length }: { count?: number }) {
  const layer = useRef<HTMLDivElement | null>(null);
  const depth = useRef<((value: number) => void) | null>(null);
  const reducedMotion = useReducedMotionSafe();

  const petals = PETALS.slice(0, Math.max(0, Math.min(count, PETALS.length)));

  useEffect(() => {
    const root = layer.current;
    if (!root || reducedMotion) return; // no float, no drift (story 22)

    let promoted: HTMLElement[] = [];

    const context = gsap.context(() => {
      const nodes = gsap.utils.toArray<HTMLElement>(`.${styles.petal}`);
      promoted = [...nodes, root];

      nodes.forEach((node) => {
        const cycle = Number(node.dataset.cycle ?? 16);
        const driftX = Number(node.dataset.driftX ?? 0);
        const driftY = Number(node.dataset.driftY ?? 0);

        node.style.willChange = 'transform';
        gsap.to(node, {
          xPercent: driftX,
          yPercent: driftY,
          rotation: `+=${driftX > 0 ? 8 : -8}`,
          duration: cycle,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      /* Depth on scroll: the layer recedes as the film moves on, driven by the
         one scroll loop rather than a ScrollTrigger of its own. */
      root.style.willChange = 'transform';
      const setY = gsap.quickTo(root, 'yPercent', { duration: 0.6, ease: 'power2.out' });
      const setScale = gsap.quickTo(root, 'scale', { duration: 0.6, ease: 'power2.out' });
      depth.current = (progress: number) => {
        setY(-6 * progress);
        setScale(1 - 0.12 * progress);
      };
    }, root);

    return () => {
      depth.current = null;
      context.revert();
      /* Cleared on exactly the nodes it was set on — a will-change left behind
         keeps a compositor layer alive for nothing (R40). */
      for (const node of promoted) node.style.willChange = '';
      promoted = [];
    };
  }, [reducedMotion]);

  useScrollProgress((progress) => depth.current?.(progress));

  return (
    <div ref={layer} className={styles.layer} aria-hidden="true" data-decor="petals">
      {petals.map((petal, index) => (
        <span
          key={`${petal.x}-${petal.y}`}
          className={`${styles.petal} ${styles[`depth${petal.depth}`]}`}
          data-optional={petal.optional ? 'true' : undefined}
          data-cycle={petal.cycle}
          data-drift-x={petal.driftX}
          data-drift-y={petal.driftY}
          data-index={index}
          style={
            {
              left: `${petal.x}%`,
              top: `${petal.y}%`,
              width: `${petal.size}vmin`,
              height: `${petal.size * 1.75}vmin`, // a petal is taller than it is wide
              marginLeft: `${-petal.size / 2}vmin`,
              marginTop: `${(-petal.size * 1.75) / 2}vmin`,
              '--petal-sprite': petalSprite(petal.depth),
              '--petal-turn': `${petal.turn}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
