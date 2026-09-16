'use client';

import { useEffect, useRef } from 'react';
import { studio } from '@/config/studio.config';
import type { Dictionary, Locale } from '@/content';
import { SCENE_IDS, useReducedMotionSafe, useScene } from '@/lib/motion';
import { formatCount, statSlots } from './stat-slots';
import { useStatsFixture } from './stats-fixture';
import { usePageLocale } from '@/components/Prices/usePageLocale';
import styles from './Stats.module.css';

export interface StatsProps {
  dictionary: Dictionary;
}

/**
 * Writes how far each counter has run. `reached` is the latch of story 44: a
 * counter is never painted below the value it already showed, so a rebuilt
 * scene, a resize or a scroll back up cannot send it to zero again.
 */
function paintCounters(
  root: HTMLElement,
  locale: Locale,
  reached: Record<string, number>,
  progress: number,
): void {
  /* Read the slots on every pass: they may have been re-rendered since the
     scene was built. */
  for (const item of root.querySelectorAll<HTMLElement>('[data-stat]')) {
    const output = item.querySelector<HTMLElement>('[data-stat-number]');
    const id = item.dataset.statId;
    const target = Number(item.dataset.statValue);
    if (!output || !id || !Number.isFinite(target)) continue;
    const value = Math.max(target * progress, reached[id] ?? 0);
    reached[id] = value;
    output.textContent = formatCount(value, locale);
  }
}

/**
 * Step 11 of §4. The numbers run up once and stay there: what is on screen
 * never falls below what it has already reached, so scrolling back and forth
 * cannot replay the run-up (story 44). The tween lives on the scene timeline
 * and dies with it — nothing of this section outlives its scene.
 */
export function Stats({ dictionary }: StatsProps) {
  const text = dictionary.sections.stats;
  const locale = usePageLocale();
  const fixture = useStatsFixture(text.eyebrow);
  const slots = statSlots(fixture ?? studio.stats, locale, text.pending);
  /* How far each counter has already run, kept across rebuilds of the scene
     (reduced-motion switch, resize) so a rebuild never resets it to zero. */
  const reached = useRef<Record<string, number>>({});

  const reducedMotion = useReducedMotionSafe();

  const ref = useScene<HTMLElement>(SCENE_IDS.counter, ({ root, timeline, reducedMotion: reduce }) => {
    const items = root.querySelectorAll<HTMLElement>('[data-stat]');
    if (!items.length || reduce) return;

    timeline.fromTo(
      items,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, ease: 'none', duration: 0.4, stagger: 0.1 },
      0,
    );

    /* The run-up is a child of the scene timeline: it is scrubbed with the
       scene and killed with it, and the latch above keeps it to one run. */
    const run = { progress: 0 };
    paintCounters(root, locale, reached.current, 0);
    timeline.fromTo(
      run,
      { progress: 0 },
      {
        progress: 1,
        ease: 'power2.out',
        duration: 0.5,
        onUpdate: () => paintCounters(root, locale, reached.current, run.progress),
      },
      0.15,
    );
  });

  /* Counters start where they left off — at zero on first paint — whatever
     re-rendered them; with reduced motion the final values stay as served. */
  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion) return;
    paintCounters(root, locale, reached.current, 0);
  }, [ref, locale, reducedMotion, slots]);

  return (
    <section id="stats" ref={ref} className={styles.section} aria-labelledby="stats-title">
      <div className={`glassCard ${styles.card}`}>
        <div className={`contentWidth ${styles.inner}`}>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="stats-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>

          <ul className={styles.row}>
            {slots.map((slot, index) => (
              <li
                /* By position, so a slot that fills in later keeps its node
                   and the scene keeps the element it is animating. */
                key={index}
                data-stat-id={slot.id}
                className={styles.stat}
                data-stat=""
                {...(slot.kind === 'value' ? { 'data-stat-value': String(slot.value) } : {})}
              >
                {slot.kind === 'value' ? (
                  <p className={styles.number}>
                    <span data-stat-number="">{slot.text}</span>
                    {slot.suffix ? <span className={styles.suffix}>{slot.suffix}</span> : null}
                  </p>
                ) : (
                  <p className={styles.number} data-placeholder title={text.pendingNote}>
                    —
                  </p>
                )}
                <p className={styles.label}>{slot.label}</p>
              </li>
            ))}
          </ul>

          {slots[0]?.kind === 'pending' ? <p className={styles.pendingNote}>{text.pendingNote}</p> : null}
        </div>
      </div>
    </section>
  );
}
