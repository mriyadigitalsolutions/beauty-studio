'use client';

import { motion } from 'framer-motion';
import { Prices } from '@/components/Prices/Prices';
import type { Dictionary } from '@/content';
import { SCENE_IDS, useReducedMotionSafe, useScene } from '@/lib/motion';
import { HOVER_LIFT, HOVER_SPRING } from './card-hover';
import styles from './Benefits.module.css';

export interface BenefitsProps {
  dictionary: Dictionary;
}

/**
 * Second half of step 9 of §4: why light and not wax, card by card, each one
 * carrying the line it is compared against. The price table follows straight
 * after it — it prices exactly these zones and belongs to the same step.
 */
export function Benefits({ dictionary }: BenefitsProps) {
  const text = dictionary.sections.benefits;
  const reducedMotion = useReducedMotionSafe();

  const ref = useScene<HTMLElement>(SCENE_IDS.cards, ({ root, timeline }) => {
    const cards = root.querySelectorAll<HTMLElement>('[data-benefit]');
    if (!cards.length) return;
    timeline.fromTo(
      cards,
      { opacity: 0, y: 52 },
      { opacity: 1, y: 0, ease: 'none', duration: 0.35, stagger: 0.1 },
      0,
    );
  });

  return (
    <>
      <section id="benefits" ref={ref} className={styles.section} aria-labelledby="benefits-title">
        <div className={`glassCard ${styles.card}`}>
          <div className={`contentWidth ${styles.inner}`}>
            <p className="eyebrow">{text.eyebrow}</p>
            <h2 id="benefits-title">{text.title}</h2>
            <p className="lead">{text.lead}</p>

            <ul className={styles.grid}>
              {text.items.map((item) => (
                <li key={item.title} className={styles.slot} data-benefit="">
                  <motion.article
                    className={styles.benefit}
                    whileHover={reducedMotion ? undefined : HOVER_LIFT}
                    transition={HOVER_SPRING}
                  >
                    <p className={styles.badge}>{text.laserLabel}</p>
                    <h3 className={styles.benefitTitle}>{item.title}</h3>
                    <p className={styles.benefitText}>{item.text}</p>
                    <p className={styles.wax}>
                      <span className={styles.waxLabel}>{text.waxLabel}</span>
                      <span>{item.wax}</span>
                    </p>
                  </motion.article>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Prices dictionary={dictionary} />
    </>
  );
}
