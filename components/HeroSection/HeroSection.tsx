import { PillButton } from '@/components/ui/PillButton/PillButton';
import type { Dictionary } from '@/content';
import styles from './HeroSection.module.css';

export interface HeroSectionProps {
  dictionary: Dictionary;
}

/**
 * First screen in the key of the reference: a full-bleed glass card with a
 * pastel mesh gradient, a two-line display headline and one white pill below.
 * Motion belongs to a later ticket; the start state lives in CSS.
 */
export function HeroSection({ dictionary }: HeroSectionProps) {
  const text = dictionary.sections.hero;

  return (
    <section id="hero" className={styles.section} aria-labelledby="hero-title">
      <div className={`glassCard meshGradient ${styles.card}`}>
        <div className={styles.center}>
          <p className="eyebrow">{text.eyebrow}</p>
          <h1 id="hero-title" className={styles.title}>
            <span>{text.titleLine1}</span>
            <span>{text.titleLine2}</span>
          </h1>
          <p className={styles.subtitle}>{text.subtitle}</p>
          <p className={`lead ${styles.lead}`}>{text.lead}</p>
        </div>
        <div className={styles.bottom}>
          <PillButton variant="solid" size="lg" href="#how-it-works">
            {text.scrollCta}
          </PillButton>
        </div>
      </div>
    </section>
  );
}
