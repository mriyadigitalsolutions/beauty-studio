'use client';

import { studio } from '@/config/studio.config';
import type { Dictionary } from '@/content';
import { SCENE_IDS, useScene } from '@/lib/motion';
import { priceRows } from './price-rows';
import { usePageLocale } from './usePageLocale';
import styles from './Prices.module.css';

export interface PricesProps {
  dictionary: Dictionary;
}

/**
 * Zones and prices (story 50). Part of the cards step of §4, standing right
 * after the benefits it prices. Until the owner fills in a single zone the
 * whole block renders nothing — an empty frame is worse than no frame
 * (story 42).
 */
export function Prices({ dictionary }: PricesProps) {
  const text = dictionary.sections.prices;
  const locale = usePageLocale();
  const rows = priceRows(studio.prices, locale);

  const ref = useScene<HTMLElement>(
    SCENE_IDS.cards,
    ({ root, timeline }) => {
      const lines = root.querySelectorAll<HTMLElement>('[data-price-row]');
      if (!lines.length) return;
      timeline.fromTo(
        lines,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, ease: 'none', duration: 0.3, stagger: 0.07 },
        0,
      );
    },
    /* Not pinned: a long price list must be free to be taller than a screen. */
    { pin: false, lengthVh: 70, start: 'top 80%' },
  );

  if (!rows.length) return null;

  return (
    <section id="prices" ref={ref} className={styles.section} aria-labelledby="prices-title">
      <div className={`glassCard ${styles.card}`}>
        <div className={`contentWidth ${styles.inner}`}>
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="prices-title">{text.title}</h2>
          <p className="lead">{text.lead}</p>

          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{text.zoneColumn}</th>
                <th scope="col" className={styles.priceColumn}>
                  {text.priceColumn}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-price-row="">
                  <th scope="row">{row.zone}</th>
                  <td className={styles.priceColumn}>{row.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className={styles.note}>{text.perSession}</p>
        </div>
      </div>
    </section>
  );
}
