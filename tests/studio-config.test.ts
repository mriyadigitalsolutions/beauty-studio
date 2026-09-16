import { describe, expect, it } from 'vitest';
import { hasValue, isPlaceholder, studio } from '@/config/studio.config';

describe('isPlaceholder', () => {
  it('recognises the bracket form the owner has not filled in yet', () => {
    expect(isPlaceholder('[ТЕЛЕФОН]')).toBe(true);
    expect(isPlaceholder('[НАЗВАНИЕ СТУДИИ]')).toBe(true);
    expect(isPlaceholder('  [АДРЕС]  ')).toBe(true);
  });

  it('does not mistake real data for a placeholder', () => {
    expect(isPlaceholder('+49 30 1234567')).toBe(false);
    expect(isPlaceholder('Studio [Mitte]')).toBe(false);
    expect(isPlaceholder('')).toBe(false);
  });
});

describe('hasValue', () => {
  it('is false for a placeholder and for an empty string', () => {
    expect(hasValue('[ТЕЛЕФОН]')).toBe(false);
    expect(hasValue('   ')).toBe(false);
  });

  it('is true only for something the owner actually typed', () => {
    expect(hasValue('+49 30 1234567')).toBe(true);
  });
});

describe('studio config', () => {
  it('ships with placeholders, never with invented facts', () => {
    expect(isPlaceholder(studio.name)).toBe(true);
    expect(isPlaceholder(studio.phone)).toBe(true);
    expect(isPlaceholder(studio.bookingUrl)).toBe(true);
    expect(isPlaceholder(studio.address.street)).toBe(true);
  });

  it('ships with empty lists so that empty blocks hide instead of showing frames', () => {
    expect(studio.prices).toEqual([]);
    expect(studio.stats).toEqual([]);
  });
});
