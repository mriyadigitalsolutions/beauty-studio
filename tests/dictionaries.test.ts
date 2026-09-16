import { describe, expect, it } from 'vitest';
import { getDictionary } from '@/content';
import { locales } from '@/content/locales';

type Json = string | { [key: string]: Json };

function leafPaths(node: Json, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  return Object.keys(node)
    .sort()
    .flatMap((key) => leafPaths(node[key] as Json, prefix ? `${prefix}.${key}` : key));
}

const reference = leafPaths(getDictionary('de') as unknown as Json);

describe('dictionaries', () => {
  it('has one section per section of the site, plus nav, footer and legal', () => {
    const de = getDictionary('de');
    expect(Object.keys(de.sections).sort()).toEqual(
      ['benefits', 'cta', 'hero', 'howItWorks', 'laserReveal', 'prices', 'skinLayers', 'stats'].sort(),
    );
    expect(de.nav).toBeTypeOf('object');
    expect(de.footer).toBeTypeOf('object');
    expect(de.legal).toBeTypeOf('object');
  });

  for (const locale of locales) {
    it(`${locale} has exactly the same keys as de`, () => {
      expect(leafPaths(getDictionary(locale) as unknown as Json)).toEqual(reference);
    });

    it(`${locale} has no empty strings left to fill`, () => {
      const dictionary = getDictionary(locale) as unknown as Json;
      const empty = reference.filter((path) => {
        const value = path
          .split('.')
          .reduce<Json>((node, key) => (node as { [k: string]: Json })[key] as Json, dictionary);
        return typeof value !== 'string' || value.trim() === '';
      });
      expect(empty).toEqual([]);
    });

    it(`${locale} keeps studio facts out of the texts`, () => {
      const text = JSON.stringify(getDictionary(locale));
      expect(text).not.toMatch(/\+\d[\d\s()-]{7,}/);
      expect(text).not.toMatch(/€|\$|₽/);
    });
  }
});
