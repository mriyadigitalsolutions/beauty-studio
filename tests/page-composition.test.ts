import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { repoRoot } from './support/palette';

/**
 * Who puts a section on the page.
 *
 * The rule of the build (interfaces.md): `app/[locale]/page.tsx` composes the
 * page and a section component owns only its own screen. `<Prices/>` was
 * rendered from inside `<Benefits/>`, which gave Benefits a second reason to
 * change and hid a whole section from the file that is supposed to list them.
 * The order on screen is unchanged — Prices still follows Benefits — but the
 * page is the one that says so.
 */
const page = readFileSync(join(repoRoot, 'app/[locale]/page.tsx'), 'utf8');
const benefits = readFileSync(join(repoRoot, 'components/Benefits/Benefits.tsx'), 'utf8');

/** Order of `<Name ` tags as the file writes them (a generic like
    `useScene<HTMLElement>` is closed by `>` and is not one). */
function rendered(source: string): string[] {
  return [...source.matchAll(/<([A-Z][A-Za-z]*)[\s/]/g)].map((match) => match[1]!);
}

describe('the page composes the sections', () => {
  it('renders all eight sections of the film, Prices between Benefits and Stats', () => {
    expect(rendered(page)).toEqual([
      'HeroSection',
      'LaserReveal',
      'SkinLayers',
      'HowItWorks',
      'Benefits',
      'Prices',
      'Stats',
      'CTA',
    ]);
  });

  it('leaves Benefits with one section of its own and nothing else', () => {
    expect(rendered(benefits)).not.toContain('Prices');
    expect(benefits).not.toContain('@/components/Prices/Prices');
  });
});
