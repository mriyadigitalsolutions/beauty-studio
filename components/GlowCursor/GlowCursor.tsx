'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion, useAnimationControls, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotionSafe } from '@/lib/motion/useReducedMotionSafe';
import styles from './GlowCursor.module.css';

/*
 * The glow that follows the mouse (stories 6, 7). Framer Motion, not GSAP:
 * §2 gives Framer everything that is not tied to the scroll, and this is the
 * clearest case of it — a spring chasing a pointer, with no scroll progress
 * anywhere in it.
 *
 * It never mounts where it would be pointless or unwelcome: a screen you
 * touch has nowhere to put a lagging halo (story 38), and a visitor who asked
 * for less motion should not get a permanently moving layer (§12).
 */

const FINE_POINTER = '(pointer: fine)';

/** Soft and slow enough that the glow is visibly behind a fast hand. */
const TRAIL = { stiffness: 140, damping: 20, mass: 0.5 } as const;

/** What counts as interactive — the same set the focus ring lands on. */
const INTERACTIVE = 'a[href], button, [role="button"], summary, input, select, textarea, label';

function subscribeFinePointer(onChange: () => void): () => void {
  const media = window.matchMedia(FINE_POINTER);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** Whether this visitor has a pointer that can be followed at all. */
function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false, // the server cannot know; the glow appears after hydration
  );
}

export function GlowCursor() {
  const finePointer = useFinePointer();
  const reducedMotion = useReducedMotionSafe();

  if (!finePointer || reducedMotion) return null;
  return <Glow />;
}

function Glow() {
  const x = useSpring(useMotionValue(0), TRAIL);
  const y = useSpring(useMotionValue(0), TRAIL);
  const rippleX = useMotionValue(0);
  const rippleY = useMotionValue(0);
  const ripple = useAnimationControls();

  const [over, setOver] = useState(false);
  const [awake, setAwake] = useState(false);
  /*
   * One wave element, re-launched on every click, instead of one element per
   * click: a stack of overlapping waves is exactly what the brief rules out,
   * and a list that has to be pruned is a slower way to get there.
   */
  const [seq, setSeq] = useState(0);
  const interactive = useRef(false);

  useEffect(() => {
    let seen = false;

    const move = (event: PointerEvent) => {
      if (seen) {
        x.set(event.clientX);
        y.set(event.clientY);
      } else {
        /* The first sighting is not a movement: springing in from the corner
           of the screen would be a sweep nobody made. */
        seen = true;
        x.jump(event.clientX);
        y.jump(event.clientY);
      }
      setAwake(true);

      const target = event.target as Element | null;
      const isInteractive = target?.closest?.(INTERACTIVE) != null;
      if (isInteractive !== interactive.current) {
        interactive.current = isInteractive;
        setOver(isInteractive);
      }
    };

    const leave = () => setAwake(false);

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, [x, y]);

  useEffect(() => {
    const down = (event: PointerEvent) => {
      rippleX.set(event.clientX);
      rippleY.set(event.clientY);
      setSeq((value) => value + 1);
      ripple.set({ scale: 0.2, opacity: 0.5 });
      void ripple.start({
        scale: 1,
        opacity: 0,
        transition: { duration: 0.55, ease: 'easeOut' },
      });
    };

    window.addEventListener('pointerdown', down, { passive: true });
    return () => window.removeEventListener('pointerdown', down);
  }, [ripple, rippleX, rippleY]);

  return (
    <>
      <motion.span
        className={styles.glow}
        data-glow-cursor=""
        data-cursor-over={over ? 'interactive' : 'idle'}
        data-cursor-awake={awake ? 'true' : 'false'}
        style={{ x, y }}
        aria-hidden="true"
      />
      <motion.span
        className={styles.ripple}
        data-cursor-ripple=""
        data-ripple-seq={seq}
        style={{ x: rippleX, y: rippleY }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={ripple}
        aria-hidden="true"
      />
    </>
  );
}
