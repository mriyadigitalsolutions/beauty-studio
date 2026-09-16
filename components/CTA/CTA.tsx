'use client';

import { PillButton } from '@/components/ui/PillButton/PillButton';
import { hasValue, studio } from '@/config/studio.config';
import type { Dictionary } from '@/content';
import { activeMessengers, bookingHref, callHref } from '@/lib/contact';
import { SCENE_IDS, useScene } from '@/lib/motion';
import { ctaAction } from './cta-action';
import styles from './CTA.module.css';

export interface CTAProps {
  dictionary: Dictionary;
}

/** Step 13 of §4: the last screen — one way in, plus the quieter ones. */
export function CTA({ dictionary }: CTAProps) {
  const text = dictionary.sections.cta;
  const action = ctaAction(hasValue(studio.bookingUrl), bookingHref(), callHref());
  const phone = callHref();
  const messengers = activeMessengers();
  const messengerLabels: Record<string, string> = text.messengers;

  const ref = useScene<HTMLElement>(SCENE_IDS.cta, ({ root, timeline }) => {
    const rows = root.querySelectorAll<HTMLElement>('[data-cta-row]');
    if (!rows.length) return;
    timeline.fromTo(
      rows,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, ease: 'none', duration: 0.4, stagger: 0.12 },
      0,
    );
  });

  return (
    <section id="cta" ref={ref} className={styles.section} aria-labelledby="cta-title">
      <div className={`glassCard ${styles.card}`}>
        <div className={`contentWidth ${styles.inner}`}>
          <p className="eyebrow" data-cta-row="">
            {text.eyebrow}
          </p>
          <h2 id="cta-title" data-cta-row="">
            {text.title}
          </h2>
          <p className="lead" data-cta-row="">
            {text.lead}
          </p>

          <div className={styles.actions} data-cta-row="">
            <PillButton
              variant="solid"
              size="lg"
              href={action.href ?? undefined}
              disabled={action.disabled}
              title={action.disabled ? text.unavailableNote : undefined}
            >
              {action.kind === 'none' ? text.unavailable : action.kind === 'call' ? text.call : text.book}
            </PillButton>

            {phone ? (
              <a className={styles.phone} href={phone}>
                <span className={styles.phoneLabel}>{text.call}</span>
                <span className={styles.phoneValue}>{studio.phone}</span>
              </a>
            ) : null}
          </div>

          {action.disabled ? (
            <p className={styles.reason} data-cta-row="" data-cta-unavailable="">
              {text.unavailableNote}
            </p>
          ) : null}

          {messengers.length ? (
            <div className={styles.messengers} data-cta-row="">
              <span className={styles.messengerLabel}>{text.contactLabel}</span>
              <ul>
                {messengers.map((messenger) => (
                  <li key={messenger.id}>
                    <PillButton variant="ghost" size="sm" href={messenger.href}>
                      {messengerLabels[messenger.id] ?? messenger.id}
                    </PillButton>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
