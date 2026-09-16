/** The three languages of the brief. German is the default. */
export const locales = ['de', 'en', 'ru'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'de';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
