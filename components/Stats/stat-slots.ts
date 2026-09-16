import type { StatItem } from '@/config/studio.config';
import type { Locale } from '@/content';

/**
 * What the counter row shows. A studio that has not filled in its numbers
 * gets visible empty slots — never a plausible-looking invented figure
 * (§8, story 20).
 */

/** How many empty slots stand in for the counters while the config is empty. */
export const PLACEHOLDER_SLOTS = 3;

export type StatSlot =
  | { id: string; kind: 'value'; value: number; text: string; suffix: string; label: string }
  | { id: string; kind: 'pending'; label: string };

/** Grouping of the page language; the same map as `lib/format` uses. */
const NUMBER_LOCALE: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en-GB',
  ru: 'ru-RU',
};

export function formatCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(Math.round(value));
}

export function statSlots(
  stats: readonly StatItem[],
  locale: Locale,
  pendingLabel: string,
): StatSlot[] {
  if (!stats.length) {
    return Array.from({ length: PLACEHOLDER_SLOTS }, (_, index) => ({
      id: `pending-${'i'.repeat(index + 1)}`,
      kind: 'pending' as const,
      label: pendingLabel,
    }));
  }

  return stats.map((stat) => ({
    id: stat.id,
    kind: 'value' as const,
    value: stat.value,
    text: formatCount(stat.value, locale),
    suffix: stat.suffix ?? '',
    label: stat.label[locale],
  }));
}
