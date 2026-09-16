'use client';

import { motion } from 'framer-motion';
import type { Dictionary } from '@/content';
import { SCENE_IDS, useReducedMotionSafe, useScene } from '@/lib/motion';
import { HOVER_LIFT, HOVER_SPRING } from '@/components/Benefits/card-hover';
import styles from './HowItWorks.module.css';

export interface HowItWorksProps {
  dictionary: Dictionary;
}

/**
 * First half of step 9 of §4: what happens in the room, in numbered steps
 * that cascade in as the scene scrubs. The scroll belongs to GSAP; hover
 * belongs to Framer Motion (§2), and the two never touch the same element.
 */
export function HowItWorks({ dictionary }: HowItWorksProps) {
  const text = dictionary.sections.howItWorks;
  const reducedMotion = useReducedMotionSafe();

  const ref = useScene<HTMLElement>(SCENE_IDS.cards, ({ root, timeline }) => {
    const steps = root.querySelectorAll<HTMLElement>('[data-step]');
    if (!steps.length) return;
    timeline.fromTo(
      steps,
      { opacity: 0, y: 44 },
      { opacity: 1, y: 0, ease: 'none', duration: 0.35, stagger: 0.12 },
      0,
    );
  });

  return (
    <section id="how-it-works" ref={ref} className={styles.section} aria-labelledby="how-it-works-title">
      <div className={`glassCard ${styles.card}`}>
        <div className={`contentWidth ${styles.inner}`}>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="how-it-works-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>

          <ol className={styles.steps}>
            {text.steps.map((step, index) => (
              <li key={step.title} className={styles.stepSlot} data-step="">
                <motion.article
                  className={styles.step}
                  whileHover={reducedMotion ? undefined : HOVER_LIFT}
                  transition={HOVER_SPRING}
                >
                  <p className={styles.index}>
                    <span className="visuallyHidden">{`${text.stepLabel} `}</span>
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </motion.article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
