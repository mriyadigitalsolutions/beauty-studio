import type { Dictionary } from '@/content';
import styles from './CTA.module.css';

export interface CTAProps {
  dictionary: Dictionary;
}

/**
 * Placeholder scene. Ticket 01 only puts it on the page in the order of §4;
 * the scene itself is filled in by a later ticket, inside this folder.
 */
export function CTA({ dictionary }: CTAProps) {
  const text = dictionary.sections.cta;

  return (
    <section id="cta" className={styles.section} aria-labelledby="cta-title">
      <div className={`glassCard ${styles.card}`}>
        <div className="contentWidth">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="cta-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>
        </div>
      </div>
    </section>
  );
}
