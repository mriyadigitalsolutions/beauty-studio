'use client';

import { useCallback, useRef } from 'react';
import type { Dictionary } from '@/content';
import { SCENE_IDS, useScene, type SceneBuild } from '@/lib/motion';
import { LaserStage } from './LaserStage';
import {
  DISSOLVE_BAND,
  HAIR_STROKES,
  maskEdgeY,
  REVEAL_END,
  shinPointAt,
} from './laser-geometry';
import { useScenePhotos } from './useSceneImage';
import styles from './LaserReveal.module.css';

export interface LaserRevealProps {
  dictionary: Dictionary;
}

/*
 * The core of the film (§5). Two steps of §4 live here: `hand-reveal`, where
 * the applicator travels down the shin and the skin opens behind it, and
 * `hair-dissolve`, the settled frame that carries the seam flash into Skin
 * Layers. They are two pinned acts one after the other, so the second one
 * takes over exactly where the first unpins.
 *
 * On the photographed hand: the brief's first choice was to cut the palm out
 * of the right-hand frame and walk it down the leg. The photograph does not
 * allow it — the hand rests on skin of its own tone with no contrast along the
 * boundary, and its wrist runs out of the frame, so any feathered clip path
 * drags a floating stub across the shin. The scene therefore uses the
 * fallback the specification names: a drawn applicator in the palette of the
 * design system rides the dissolve edge, and the photographed hand is left
 * exactly where it is — resting at the top of the treated frame, which is the
 * frame the scene settles on.
 */
export function LaserReveal({ dictionary }: LaserRevealProps) {
  const text = dictionary.sections.laserReveal;
  const anchor = useRef<HTMLElement | null>(null);
  const photos = useScenePhotos(2, anchor);

  const buildReveal = useCallback<SceneBuild>(({ root, timeline }) => {
    const fade = root.querySelector<SVGLinearGradientElement>('[data-laser-fade]');
    const applicator = root.querySelector<SVGGElement>('[data-laser-applicator]');
    const body = root.querySelector<SVGGElement>('[data-laser-applicator-body]');


    root.dataset.laserProgress = '0';
    timeline.eventCallback('onUpdate', () => {
      root.dataset.laserProgress = timeline.progress().toFixed(3);
    });

    if (fade) {
      /* The whole scene is this one move: the fade band walks down the frame,
         and feTurbulence frays its edge on the way (§5). */
      timeline.to(
        fade,
        {
          attr: { y1: maskEdgeY(1) - DISSOLVE_BAND, y2: maskEdgeY(1) },
          ease: 'none',
          duration: REVEAL_END,
        },
        0,
      );
    }

    if (applicator && body) {
      const end = shinPointAt(1);
      timeline.to(body, { x: end.x, y: end.y, ease: 'none', duration: 1 }, 0);
      timeline.fromTo(applicator, { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0);
      timeline.to(applicator, { opacity: 0, duration: 0.1 }, REVEAL_END);
    }

    /* Every stroke goes when the edge reaches it, and not a moment before.
       Each one is found by its own id: matching by position would hold only
       while two separately built arrays happen to be in the same order. */
    for (const hair of HAIR_STROKES) {
      const element = root.querySelector<SVGLineElement>(`[data-hair="${hair.id}"]`);
      if (!element) continue;
      timeline.to(
        element,
        {
          x: hair.driftX,
          y: hair.driftY,
          opacity: 0,
          duration: 0.07,
          ease: 'power2.out',
        },
        Math.min(Math.max(hair.at - 0.02, 0), 0.93),
      );
    }
  }, []);

  const buildSettle = useCallback<SceneBuild>(({ root, timeline }) => {
    const caption = root.querySelector<HTMLElement>('[data-laser-caption]');
    root.dataset.laserProgress = '1';
    if (caption) timeline.fromTo(caption, { opacity: 0, y: 18 }, { opacity: 1, y: 0 }, 0);
  }, []);

  const revealRef = useScene<HTMLDivElement>(SCENE_IDS.handReveal, buildReveal, { lengthVh: 140 });
  const settleRef = useScene<HTMLDivElement>(SCENE_IDS.hairDissolve, buildSettle, { lengthVh: 80 });

  return (
    <section
      id="laser-reveal"
      ref={anchor}
      className={styles.section}
      aria-labelledby="laser-reveal-title"
    >
      <div ref={revealRef} className={styles.act}>
        <div className={`glassCard ${styles.card}`}>
          <div className={styles.copy}>
            <p className="eyebrow">{text.eyebrow}</p>
            <h2 id="laser-reveal-title">{text.title}</h2>
            <p className="lead">{text.lead}</p>
            <p className={styles.labels}>
              <span data-laser-label="before">{text.beforeLabel}</span>
              <span aria-hidden="true">·</span>
              <span data-laser-label="after">{text.afterLabel}</span>
            </p>
            {photos.state === 'failed' && (
              <p className={styles.unavailable} data-laser-unavailable>
                {text.photoUnavailable}
              </p>
            )}
          </div>
          <LaserStage photos={photos} alt={text.photoAlt} />
        </div>
      </div>

      {/* The settled frame: the photograph the scene ends on, and the step
          that owns the flash into Skin Layers. Hidden outside the pinned
          scenario, where the first act already ends on that frame. */}
      <div ref={settleRef} className={`${styles.act} ${styles.tail}`}>
        <div className={`glassCard ${styles.card} ${styles.tailCard}`}>
          <LaserStage photos={photos} alt={text.photoAlt} variant="final" />
          <p className={styles.caption} data-laser-caption>
            {text.afterLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
