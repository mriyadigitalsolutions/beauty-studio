'use client';

import { useEffect, useState } from 'react';
import type { Dictionary } from '@/content';
import { useReducedMotionSafe } from '@/lib/motion';
import { FILM_STOPS } from '@/lib/motion/timeline';
import styles from './SceneProgress.module.css';

/*
 * Where in the film the visitor is, and a way to skip (story 49). One thin
 * rail of marks down the right edge, one mark per stop of `timeline.ts`.
 *
 * It is `aria-hidden` on purpose, and its marks are out of the tab order: the
 * very same seven destinations are in the header menu, with labels and a
 * keyboard contract, so exposing them twice would only make a screen reader
 * read the site's navigation twice. This rail is the pointer shortcut.
 *
 * Where the visitor is comes from one IntersectionObserver over the seven
 * sections, not from measuring them on every frame of the scroll: seven
 * `getBoundingClientRect()` calls in the same frame GSAP is moving scenes in
 * is the layout thrash §11 exists to prevent.
 */

export interface SceneProgressProps {
  dictionary: Dictionary;
}

export function SceneProgress({ dictionary }: SceneProgressProps) {
  const reducedMotion = useReducedMotionSafe();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    const sections = FILM_STOPS.map((stop) => document.getElementById(stop.anchor));
    /* A band one pixel tall across the middle of the screen: whatever crosses
       it is the scene the visitor is looking at. */
    const observer = new IntersectionObserver(
      () => {
        const middle = window.innerHeight / 2;
        let crossing = -1;
        sections.forEach((section, index) => {
          if (!section) return;
          const box = section.getBoundingClientRect();
          if (box.top <= middle && box.bottom >= middle) crossing = index;
        });
        setCurrent((previous) => (crossing < 0 ? previous : crossing));
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );

    for (const section of sections) if (section) observer.observe(section);
    return () => observer.disconnect();
  }, [reducedMotion]);

  /* No film, no indicator of where in it you are (§12). */
  if (reducedMotion) return null;

  return (
    <div className={styles.rail} data-scene-progress="" aria-hidden="true">
      {FILM_STOPS.map((stop, index) => (
        <a
          key={stop.anchor}
          className={styles.stop}
          href={`#${stop.anchor}`}
          data-stop={stop.anchor}
          data-current={index === current ? 'true' : 'false'}
          tabIndex={-1}
        >
          <span className={styles.label}>{dictionary.nav.items[stop.key]}</span>
          <span className={styles.tick} />
        </a>
      ))}
    </div>
  );
}
