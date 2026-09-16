import type { Dictionary } from '@/content';
import styles from './LaserReveal.module.css';

export interface LaserRevealProps {
  dictionary: Dictionary;
}

/**
 * Placeholder scene. Ticket 01 only puts it on the page in the order of §4;
 * the scene itself is filled in by a later ticket, inside this folder.
 */
export function LaserReveal({ dictionary }: LaserRevealProps) {
  const text = dictionary.sections.laserReveal;

  return (
    <section id="laser-reveal" className={styles.section} aria-labelledby="laser-reveal-title">
      <div className={`glassCard ${styles.card}`}>
        <div className="contentWidth">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="laser-reveal-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>
        </div>
      </div>
    </section>
  );
}
