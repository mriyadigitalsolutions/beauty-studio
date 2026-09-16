'use client';

import Link from 'next/link';
import { NavMenu } from '@/components/layout/NavMenu/NavMenu';
import { PillButton } from '@/components/ui/PillButton/PillButton';
import { ConfigValue } from '@/components/ui/ConfigValue/ConfigValue';
import { studio } from '@/config/studio.config';
import type { Dictionary, Locale } from '@/content';
import { locales } from '@/content/locales';
import { localePath } from '@/lib/i18n';
import { bookingHref, callHref } from '@/lib/contact';
import { FILM_STOPS, type FilmStopKey } from '@/lib/motion/timeline';
import styles from './SiteHeader.module.css';

/*
 * Where the menu can take a visitor — read from the assembled film rather
 * than listed again here, so a section cannot be renamed in one place and
 * stay behind in the other (ticket 06, `lib/motion/timeline.ts`).
 */
export const NAV_SECTIONS: readonly FilmStopKey[] = FILM_STOPS.map((stop) => stop.key);

export const SECTION_ANCHORS = Object.fromEntries(
  FILM_STOPS.map((stop) => [stop.key, stop.anchor]),
) as Record<FilmStopKey, string>;

export interface SiteHeaderProps {
  locale: Locale;
  dictionary: Dictionary;
}

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  const call = callHref();
  const booking = bookingHref();
  const { nav, footer } = dictionary;

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link className={styles.monogram} href={localePath(locale)} aria-label={studio.name}>
          <ConfigValue value={studio.monogram} note={footer.placeholderNote} />
        </Link>

        <NavMenu
          items={FILM_STOPS.map((stop) => ({
            href: `#${stop.anchor}`,
            label: nav.items[stop.key],
          }))}
          openLabel={nav.menu}
          closeLabel={nav.menuClose}
        />

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

    </header>
  );
}
