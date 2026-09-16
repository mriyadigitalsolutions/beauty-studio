import type { Dictionary } from '@/content';
import styles from './Stats.module.css';

export interface StatsProps {
  dictionary: Dictionary;
}

/**
 * Placeholder scene. Ticket 01 only puts it on the page in the order of §4;
 * the scene itself is filled in by a later ticket, inside this folder.
 */
export function Stats({ dictionary }: StatsProps) {
  const text = dictionary.sections.stats;

  return (
    <section id="stats" className={styles.section} aria-labelledby="stats-title">
      <div className={`glassCard ${styles.card}`}>
        <div className="contentWidth">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="stats-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>
        </div>
      </div>
    </section>
  );
}
