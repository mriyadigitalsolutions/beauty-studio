import { afterEach, describe, expect, it } from 'vitest';
import { studio } from '@/config/studio.config';
import { formatPhoneHref, formatPrice } from '@/lib/format';

/** Intl uses non-breaking spaces; the assertions compare visible text. */
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ');

const shippedCurrency = studio.currency;
afterEach(() => {
  studio.currency = shippedCurrency;
});

describe('formatPrice, currency not filled in yet', () => {
  it('formats the bare number rather than inventing a currency', () => {
    expect(plain(formatPrice(49, 'de'))).toBe('49');
    expect(plain(formatPrice(49, 'en'))).toBe('49');
    expect(plain(formatPrice(49, 'ru'))).toBe('49');
  });

  it('still groups thousands the way each language does', () => {
    expect(plain(formatPrice(1200, 'de'))).toBe('1.200');
    expect(plain(formatPrice(1200, 'en'))).toBe('1,200');
  });
});

describe('formatPrice, currency filled in by the owner', () => {
  it('puts the currency where each language puts it', () => {
    studio.currency = 'EUR';
    expect(plain(formatPrice(49, 'de'))).toBe('49 €');
    expect(plain(formatPrice(49, 'ru'))).toBe('49 €');
    expect(plain(formatPrice(49, 'en'))).toBe('€49');
  });

  it('shows two decimals only when the price has them', () => {
    studio.currency = 'EUR';
    expect(plain(formatPrice(49.5, 'de'))).toBe('49,50 €');
    expect(plain(formatPrice(49.5, 'en'))).toBe('€49.50');
  });

  it('follows whatever currency the owner typed', () => {
    studio.currency = 'CHF';
    expect(plain(formatPrice(1200, 'de'))).toBe('1.200 CHF');
  });
});

describe('formatPhoneHref', () => {
  it('strips everything a human writes for readability', () => {
    expect(formatPhoneHref('+49 (30) 1234-567')).toBe('tel:+49301234567');
    expect(formatPhoneHref('8 800 555 35 35')).toBe('tel:88005553535');
  });

  it('gives nothing to link to when the number is a placeholder', () => {
    expect(formatPhoneHref('[ТЕЛЕФОН]')).toBe('');
    expect(formatPhoneHref('   ')).toBe('');
  });
});
