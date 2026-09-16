import Link from 'next/link';
import { ConfigValue } from '@/components/ui/ConfigValue/ConfigValue';
import { studio } from '@/config/studio.config';
import type { Dictionary, Locale } from '@/content';
import { localePath } from '@/lib/i18n';
import { activeSocials, callHref } from '@/lib/contact';
import styles from './SiteFooter.module.css';

export interface SiteFooterProps {
  locale: Locale;
  dictionary: Dictionary;
}

export function SiteFooter({ locale, dictionary }: SiteFooterProps) {
  const { footer } = dictionary;
  const socials = activeSocials();
  const call = callHref();

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <p className={styles.title}>
          <ConfigValue value={studio.name} note={footer.placeholderNote} />
        </p>

        <dl className={styles.block}>
          <dt>{footer.addressLabel}</dt>
          <dd>
            <ConfigValue value={studio.address.street} note={footer.placeholderNote} />
            <br />
            <ConfigValue value={studio.address.city} note={footer.placeholderNote} />
            <br />
            <ConfigValue value={studio.address.country} note={footer.placeholderNote} />
          </dd>
          <dt>{footer.hoursLabel}</dt>
          <dd>
            <ConfigValue value={studio.hours} note={footer.placeholderNote} />
          </dd>
        </dl>

        <dl className={styles.block}>
          <dt>{footer.contactLabel}</dt>
          <dd>
            {call ? (
              <a href={call}>{studio.phone}</a>
            ) : (
              <ConfigValue value={studio.phone} note={footer.placeholderNote} />
            )}
            <br />
            <ConfigValue value={studio.email} note={footer.placeholderNote} />
          </dd>
        </dl>

        {socials.length > 0 ? (
          <dl className={styles.block}>
            <dt>{footer.socialLabel}</dt>
            <dd>
              <ul className={styles.list}>
                {socials.map((social) => (
                  <li key={social.id}>
                    <a href={social.href} target="_blank" rel="noreferrer noopener">
                      {social.id}
                    </a>
                  </li>
                ))}
              </ul>
            </dd>
          </dl>
        ) : null}
      </div>

      <div className={styles.legal}>
        <Link href={localePath(locale, '/impressum')}>{footer.impressum}</Link>
        <Link href={localePath(locale, '/datenschutz')}>{footer.datenschutz}</Link>
        <span className={styles.spacer} />
        <small>
          © {new Date().getFullYear()} <ConfigValue value={studio.name} note={footer.placeholderNote} />.{' '}
          {footer.rights}.
        </small>
      </div>
    </footer>
  );
}
