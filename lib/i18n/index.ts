import { defaultLocale, isLocale, locales, type Locale } from '@/content/locales';

export { defaultLocale, isLocale, locales };
export type { Locale };

/**
 * Picks the best of our three languages for a list of accepted language tags
 * (`navigator.languages` or an `Accept-Language` list), preserving the
 * visitor's order of preference. Falls back to German.
 */
export function negotiateLocale(accepted: readonly string[]): Locale {
  for (const tag of accepted) {
    const base = tag.trim().toLowerCase().split(/[-_;]/)[0];
    if (base && isLocale(base)) return base;
  }
  return defaultLocale;
}

/**
 * Builds an in-site URL for a locale. Paths end with a slash so that the
 * static export can be served by any host without rewrite rules.
 */
export function localePath(locale: Locale, path = '/'): string {
  const raw = path.trim();
  if (raw.startsWith('#')) return `/${locale}/${raw}`;
  const [pathname = '', hash] = raw.split('#');
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const base = clean ? `/${locale}/${clean}/` : `/${locale}/`;
  return hash ? `${base}#${hash}` : base;
}
