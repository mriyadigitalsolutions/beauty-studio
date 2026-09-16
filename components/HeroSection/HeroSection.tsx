'use client';

import { PillButton } from '@/components/ui/PillButton/PillButton';
import type { Dictionary } from '@/content';
import { SCENE_IDS, useScene } from '@/lib/motion';
import { HERO_MELT, HERO_MELT_BLUR_PX, meltSelector } from './hero-melt';
import styles from './HeroSection.module.css';

export interface HeroSectionProps {
  dictionary: Dictionary;
}

/**
 * The first screen, in the key of the reference (§14): a full-bleed glass card
 * on the peach field, a pastel mesh gradient inside it, a two-line display
 * headline over the middle, one line of grotesque under it and a single white
 * pill near the bottom. Nothing else — the reference has nothing else.
 *
 * Two steps of §4 live here: step 1 "Hero Fade", the copy melting away, and
 * step 2 "Pin Hero", which holds the card and owns the seam flash into the
 * laser scene. Both are registered through `useScene`; this file never touches
 * GSAP, ScrollTrigger or an animation frame of its own.
 */
export function HeroSection({ dictionary }: HeroSectionProps) {
  const text = dictionary.sections.hero;

  /* Step 2 — the card is held while the copy melts. `useScene` pins the
     section and asks for the flash at the seam when it is left behind. */
  const pinRef = useScene<HTMLElement>(
    SCENE_IDS.pinHero,
    ({ root, timeline, reducedMotion }) => {
      if (reducedMotion) return;
      const card = root.querySelector<HTMLElement>('[data-hero-card]');
      if (!card) return;
      /* The card recedes a hair as the film moves on — depth, not motion. */
      timeline.fromTo(
        card,
        { scale: 1 },
        { scale: 0.97, ease: 'none', duration: 1 },
        0,
      );
    },
    { lengthVh: 120 },
  );

  /* Step 1 — the copy melts in reading order over the held card. */
  const meltRef = useScene<HTMLDivElement>(
    SCENE_IDS.heroFade,
    ({ root, timeline, reducedMotion }) => {
      /* Reduced motion hands every scene over at progress 1, so an empty
         timeline is the only way the copy stays on screen (story 22). */
      if (reducedMotion) return;

      /* One unit long whatever the score adds up to, so the shares in
         `HERO_MELT` keep meaning shares of the scene. */
      timeline.to({}, { duration: 1 }, 0);

      for (const step of HERO_MELT) {
        const element = root.querySelector<HTMLElement>(meltSelector(step.target));
        if (!element) continue;
        timeline.to(
          element,
          {
            opacity: 0,
            filter: `blur(${HERO_MELT_BLUR_PX}px)`,
            y: `${step.shiftRem}rem`,
            ease: 'none',
            duration: step.end - step.start,
          },
          step.start,
        );
      }
    },
    /* As long as the pin it plays inside: the copy is gone by the time the
       card is let go, not half-way through the hold. */
    { pin: false, lengthVh: 120 },
  );

  return (
    <section ref={pinRef} id="hero" className={styles.section} aria-labelledby="hero-title">
      <div data-hero-card className={`glassCard meshGradient ${styles.card}`}>
        <div ref={meltRef} className={styles.inner}>
          <div className={styles.copy}>
            <h1 id="hero-title" className={styles.title} data-hero-melt="title">
              <span>{text.titleLine1}</span>
              <span>{text.titleLine2}</span>
            </h1>
            <p className={styles.subtitle} data-hero-melt="subtitle">
              {text.subtitle}
            </p>
          </div>
          <div className={styles.cta} data-hero-melt="cta">
            <PillButton variant="solid" size="lg" href="#how-it-works">
              {text.scrollCta}
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}
