import type { Dictionary } from '@/content';
import styles from './HowItWorks.module.css';

export interface HowItWorksProps {
  dictionary: Dictionary;
}

/**
 * Placeholder scene. Ticket 01 only puts it on the page in the order of §4;
 * the scene itself is filled in by a later ticket, inside this folder.
 */
export function HowItWorks({ dictionary }: HowItWorksProps) {
  const text = dictionary.sections.howItWorks;

  return (
    <section id="how-it-works" className={styles.section} aria-labelledby="how-it-works-title">
      <div className={`glassCard ${styles.card}`}>
        <div className="contentWidth">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="how-it-works-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>
        </div>
      </div>
    </section>
  );
}
