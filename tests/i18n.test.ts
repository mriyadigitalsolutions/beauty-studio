import { describe, expect, it } from 'vitest';
import { defaultLocale, locales } from '@/content/locales';
import { localePath, negotiateLocale } from '@/lib/i18n';

describe('negotiateLocale', () => {
  it('falls back to German when nothing is accepted', () => {
    expect(negotiateLocale([])).toBe('de');
    expect(defaultLocale).toBe('de');
  });

  it('falls back to German when no accepted language is supported', () => {
    expect(negotiateLocale(['fr-FR', 'it', 'zh-Hans'])).toBe('de');
  });

  it('matches a regional tag to its base language', () => {
    expect(negotiateLocale(['en-GB'])).toBe('en');
    expect(negotiateLocale(['ru-BY'])).toBe('ru');
    expect(negotiateLocale(['de-AT'])).toBe('de');
  });

  it('honours the order of preference, not the order of locales', () => {
    expect(negotiateLocale(['ru', 'en', 'de'])).toBe('ru');
    expect(negotiateLocale(['fr', 'en-US', 'ru'])).toBe('en');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(negotiateLocale([' RU-ru '])).toBe('ru');
  });

  it('supports exactly the three locales of the brief', () => {
    expect([...locales]).toEqual(['de', 'en', 'ru']);
  });
});

describe('localePath', () => {
  it('prefixes a path with the locale and keeps a trailing slash', () => {
    expect(localePath('de', '/')).toBe('/de/');
    expect(localePath('ru', '/impressum')).toBe('/ru/impressum/');
    expect(localePath('en', 'datenschutz')).toBe('/en/datenschutz/');
  });

  it('keeps hash-only targets on the current page', () => {
    expect(localePath('de', '#how-it-works')).toBe('/de/#how-it-works');
  });
});
