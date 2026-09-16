'use client';

import { useParams } from 'next/navigation';
import { defaultLocale, isLocale, type Locale } from '@/content';

/**
 * The language of the page, read from the route. Sections get only a
 * dictionary as a prop (§ interfaces), and prices and counters need the
 * locale itself to format numbers and to pick a zone name.
 */
export function usePageLocale(): Locale {
  const params = useParams<{ locale?: string }>();
  const candidate = typeof params?.locale === 'string' ? params.locale : '';
  return isLocale(candidate) ? candidate : defaultLocale;
}
