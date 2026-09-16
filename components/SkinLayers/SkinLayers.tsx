import type { Dictionary } from '@/content';
import styles from './SkinLayers.module.css';

export interface SkinLayersProps {
  dictionary: Dictionary;
}

/**
 * Placeholder scene. Ticket 01 only puts it on the page in the order of §4;
 * the scene itself is filled in by a later ticket, inside this folder.
 */
export function SkinLayers({ dictionary }: SkinLayersProps) {
  const text = dictionary.sections.skinLayers;

  return (
    <section id="skin-layers" className={styles.section} aria-labelledby="skin-layers-title">
      <div className={`glassCard ${styles.card}`}>
        <div className="contentWidth">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="skin-layers-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>
        </div>
      </div>
    </section>
  );
}
