import { hasValue, type PriceZone } from '@/config/studio.config';
import type { Locale } from '@/content';
import { formatPrice } from '@/lib/format';

/** One line of the table: what the visitor reads, already localised. */
export interface PriceRow {
  id: string;
  zone: string;
  price: string;
}

/**
 * A row the owner has really filled in: a name that is not a placeholder and
 * a price that is a real number. The same filled-ness question the rest of
 * the site asks, asked once, here.
 */
export function isFilledZone(zone: PriceZone, locale: Locale): boolean {
  return hasValue(zone.zone[locale]) && Number.isFinite(zone.price) && zone.price > 0;
}

/**
 * Turns the zones of `studio.prices` into rows for the page (story 50).
 * Half-filled zones drop out, and when nothing is left the section renders
 * nothing at all rather than an empty frame (story 42).
 */
export function priceRows(zones: readonly PriceZone[], locale: Locale): PriceRow[] {
  return zones.filter((zone) => isFilledZone(zone, locale)).map((zone) => ({
    id: zone.id,
    zone: zone.zone[locale],
    price: formatPrice(zone.price, locale),
  }));
}
