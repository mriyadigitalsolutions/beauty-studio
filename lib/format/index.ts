import { hasValue, studio } from '@/config/studio.config';
import type { Locale } from '@/content/locales';

/** BCP 47 tags used for number formatting; the site itself is /de, /en, /ru. */
const NUMBER_LOCALE: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-GB',
  ru: 'ru-RU',
};

/**
 * Formats a price from the studio config. Whole prices are shown without
 * decimals ("49 €"), fractional ones with two ("49,50 €").
 *
 * The currency is a fact of the studio like the prices themselves: until the
 * owner fills it in, the number is formatted without any currency at all
 * rather than in an invented one.
 */
export function formatPrice(value: number, locale: Locale): string {
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
  if (hasValue(studio.currency)) {
    options.style = 'currency';
    options.currency = studio.currency;
  }
  return new Intl.NumberFormat(NUMBER_LOCALE[locale], options).format(value);
}

/**
 * Turns a human-written phone number into a `tel:` href. An unfilled or empty
 * number gets no href at all, so nothing links into a dead end.
 */
export function formatPhoneHref(phone: string): string {
  if (!hasValue(phone)) return '';
  const digits = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return digits ? `tel:${digits}` : '';
}
