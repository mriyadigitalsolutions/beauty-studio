import { describe, expect, it } from 'vitest';
import { statSlots } from '@/components/Stats/stat-slots';
import { priceRows } from '@/components/Prices/price-rows';
import { ctaAction } from '@/components/CTA/cta-action';
import { BEAM, FOLLICLE_BULB, SKIN_LAYERS } from '@/components/SkinLayers/skin-geometry';

/**
 * Seams of ticket 05. Everything here is a pure function or a pure table —
 * what the sections render out of it is checked through the page itself in
 * `e2e/sections.spec.ts` (the two seams of the specification, §13).
 */

describe('skin cross-section (story 10, §14)', () => {
  /* The palette roles are dictated by §14, not by the drawing. */
  const ROLES: Record<string, string> = {
    epidermis: '--peach',
    dermis: '--rose',
    subcutis: '--sand',
    follicle: '--lilac',
  };

  it('paints every layer in the token §14 gives it', () => {
    expect(Object.fromEntries(SKIN_LAYERS.map((layer) => [layer.id, layer.token]))).toEqual(ROLES);
  });

  it('draws the beam in the laser token and lets it reach the root', () => {
    expect(BEAM.token).toBe('--lilac');
    /* "луч доходит до корня": the beam ends inside the follicle bulb, not
       above it and not through it. */
    expect(BEAM.endY).toBeGreaterThanOrEqual(FOLLICLE_BULB.y - FOLLICLE_BULB.r);
    expect(BEAM.endY).toBeLessThanOrEqual(FOLLICLE_BULB.y + FOLLICLE_BULB.r);

    /* And the root itself lies under the dermis, where §14 puts it. */
    const dermis = SKIN_LAYERS.find((layer) => layer.id === 'dermis')!;
    expect(FOLLICLE_BULB.y).toBeGreaterThan(dermis.y + dermis.height);
  });
});

describe('booking button (story 15, 16, 45)', () => {
  it('reads "there is a booking service" off the config, not off two hrefs', () => {
    /* The phone and the booking link may well be the same string; what makes
       the button say "book" is that `studio.bookingUrl` is filled in. */
    expect(ctaAction(true, 'tel:+4900000', 'tel:+4900000')).toEqual({
      kind: 'booking',
      href: 'tel:+4900000',
      disabled: false,
    });
  });

  it('leads to the booking service when it is configured', () => {
    expect(ctaAction(true, 'https://booksy.example/studio', 'tel:+4900000')).toEqual({
      kind: 'booking',
      href: 'https://booksy.example/studio',
      disabled: false,
    });
  });

  it('falls back to the phone when the service link is a placeholder', () => {
    expect(ctaAction(false, 'tel:+4900000', 'tel:+4900000')).toEqual({
      kind: 'call',
      href: 'tel:+4900000',
      disabled: false,
    });
  });

  it('is disabled when neither the service nor the phone is filled in', () => {
    expect(ctaAction(false, null, null)).toEqual({ kind: 'none', href: null, disabled: true });
  });
});

describe('price table (story 50, A02)', () => {
  const ZONES = [
    { id: 'underarms', zone: { de: 'Achseln', en: 'Underarms', ru: 'Подмышки' }, price: 49 },
    { id: 'legs', zone: { de: 'Beine', en: 'Legs', ru: 'Ноги' }, price: 1490.5 },
  ];

  it('shows nothing at all while the owner has not filled in a single zone', () => {
    expect(priceRows([], 'de')).toEqual([]);
  });

  it('drops a row the owner has not really filled in', () => {
    /* A zone with a price but a placeholder name must not appear as `[ЗОНА]`
       inside a real table — same filled-ness check the rest of the site uses. */
    const half = [
      { id: 'draft', zone: { de: '[ZONE]', en: '[ZONE]', ru: '[ЗОНА]' }, price: 49 },
      { id: 'legs', zone: { de: 'Beine', en: 'Legs', ru: 'Ноги' }, price: 0 },
    ];
    expect(priceRows(half, 'de')).toEqual([]);
  });

  it('takes the zone name of the page language and formats the price for it', () => {
    /* The currency of the config is still a placeholder, so the number comes
       out bare — in the grouping of the locale, never in an invented currency. */
    expect(priceRows(ZONES, 'de')).toEqual([
      { id: 'underarms', zone: 'Achseln', price: '49' },
      { id: 'legs', zone: 'Beine', price: '1.490,50' },
    ]);
    expect(priceRows(ZONES, 'ru').map((row) => row.zone)).toEqual(['Подмышки', 'Ноги']);
  });
});

describe('counters (story 14, 20, 44)', () => {
  const STATS = [
    { id: 'years', label: { de: 'Jahre', en: 'Years', ru: 'Лет' }, value: 12000, suffix: '+' },
  ];

  it('never invents a number: an empty config gives placeholder slots only', () => {
    const slots = statSlots([], 'de', 'Noch nicht eingetragen');
    expect(slots).toHaveLength(3);
    expect(slots.map((slot) => slot.kind)).toEqual(['pending', 'pending', 'pending']);
    expect(slots.every((slot) => slot.label === 'Noch nicht eingetragen')).toBe(true);
    expect(JSON.stringify(slots)).not.toMatch(/\d/);
  });

  it('formats a filled counter for the page language and keeps its suffix', () => {
    expect(statSlots(STATS, 'de', 'x')).toEqual([
      { id: 'years', kind: 'value', value: 12000, text: '12.000', suffix: '+', label: 'Jahre' },
    ]);
    expect(statSlots(STATS, 'en', 'x')[0]).toMatchObject({ text: '12,000', label: 'Years' });
  });
});
