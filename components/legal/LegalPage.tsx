import Link from 'next/link';
import { ConfigValue } from '@/components/ui/ConfigValue/ConfigValue';
import { studio } from '@/config/studio.config';
import type { Dictionary, Locale } from '@/content';
import { localePath } from '@/lib/i18n';
import styles from './LegalPage.module.css';

export type LegalPageId = 'impressum' | 'datenschutz';

export interface LegalPageProps {
  id: LegalPageId;
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * Impressum and Datenschutz (story 21, G01) — the same page with a different
 * heading, because they carry the same two things.
 *
 * The first is the owner's registration details, straight out of
 * `config/studio.config.ts` and shown as placeholders until the owner types
 * them (story 20). The second is a plain statement that the binding text is
 * written by the owner's lawyer, followed by the list of config fields that
 * text draws on. Nothing here is a legal sentence: writing one would be
 * inventing law on someone else's behalf, which is worse than an empty page.
 */
export function LegalPage({ id, locale, dictionary }: LegalPageProps) {
  const { legal, footer } = dictionary;
  const text = legal[id];
  const note = footer.placeholderNote;

  /** Config fields the lawyer's text draws on, named so both sides can check. */
  const details = [
    { path: 'studio.legal.entity', label: legal.fields.entity, value: studio.legal.entity },
    {
      path: 'studio.legal.registration',
      label: legal.fields.registration,
      value: studio.legal.registration,
    },
    {
      path: 'studio.legal.responsible',
      label: legal.fields.responsible,
      value: studio.legal.responsible,
    },
    { path: 'studio.legal.vatId', label: legal.fields.vatId, value: studio.legal.vatId },
    {
      path: 'studio.address',
      label: legal.fields.address,
      value: `${studio.address.street}, ${studio.address.city}, ${studio.address.country}`,
    },
    { path: 'studio.phone', label: legal.fields.phone, value: studio.phone },
    { path: 'studio.email', label: legal.fields.email, value: studio.email },
  ];

  return (
    <article className={`glassCard ${styles.page}`} data-legal={id}>
      <div className={`contentWidth ${styles.inner}`}>
        <h1 className={styles.title}>{text.title}</h1>
        <p className="lead">{text.lead}</p>

        <section className={styles.block} aria-labelledby={`${id}-details`}>
          <h2 id={`${id}-details`} className={styles.subtitle}>
            {legal.detailsLabel}
          </h2>
          <dl className={styles.details}>
            {details.map((field) => (
              <div key={field.path} className={styles.row}>
                <dt>{field.label}</dt>
                <dd>
                  <ConfigValue value={field.value} note={note} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.block} aria-labelledby={`${id}-pending`}>
          <h2 id={`${id}-pending`} className={styles.subtitle}>
            {text.pending}
          </h2>
          <p className={styles.pending} data-legal-pending="">
            {legal.lawyerNote}
          </p>
          <p className={styles.configLabel}>{legal.configLabel}</p>
          <ul className={styles.fields}>
            {details.map((field) => (
              <li key={field.path} data-legal-config-field={field.path}>
                <code>{field.path}</code>
                <span className={styles.fieldLabel}>{field.label}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className={styles.back}>
          <Link href={localePath(locale)}>{legal.backHome}</Link>
        </p>
      </div>
    </article>
  );
}
