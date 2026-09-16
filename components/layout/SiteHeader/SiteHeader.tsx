'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { ConfigValue } from '@/components/ui/ConfigValue/ConfigValue';
import { studio } from '@/config/studio.config';
import type { Dictionary, Locale } from '@/content';
import { locales } from '@/content/locales';
import { localePath } from '@/lib/i18n';
import { bookingHref, callHref } from '@/lib/contact';
import styles from './SiteHeader.module.css';

/** Anchors of the sections assembled on the page, in the order of §4. */
export const NAV_SECTIONS = [
  'hero',
  'laserReveal',
  'skinLayers',
  'howItWorks',
  'benefits',
  'stats',
  'cta',
] as const;

export const SECTION_ANCHORS: Record<(typeof NAV_SECTIONS)[number], string> = {
  hero: 'hero',
  laserReveal: 'laser-reveal',
  skinLayers: 'skin-layers',
  howItWorks: 'how-it-works',
  benefits: 'benefits',
  stats: 'stats',
  cta: 'cta',
};

export interface SiteHeaderProps {
  locale: Locale;
  dictionary: Dictionary;
}

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const call = callHref();
  const booking = bookingHref();
  const { nav, footer } = dictionary;

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link className={styles.monogram} href={localePath(locale)} aria-label={studio.name}>
          <ConfigValue value={studio.monogram} note={footer.placeholderNote} />
        </Link>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? nav.menuClose : nav.menu}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>

        <span className={styles.spacer} />

        <nav className={styles.languages} aria-label={nav.languageLabel}>
          {locales.map((code) => (
            <Link
              key={code}
              className={styles.language}
              href={localePath(code)}
              hrefLang={code}
              aria-current={code === locale}
              scroll={false}
            >
              {code}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <span className={styles.callAction}>
            <PillButton variant="solid" size="sm" href={call ?? undefined} disabled={!call}>
              {nav.call}
            </PillButton>
          </span>
          <PillButton variant="solid" size="sm" href={booking ?? undefined} disabled={!booking}>
            {booking ? nav.book : nav.bookUnavailable}
          </PillButton>
        </div>
      </div>

      {open ? (
        <ul className={styles.menu} id="site-menu">
          {NAV_SECTIONS.map((section) => (
            <li key={section}>
              <Link href={`#${SECTION_ANCHORS[section]}`} onClick={() => setOpen(false)}>
                {nav.items[section]}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
