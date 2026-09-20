import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/color/wcag';
import { BACKDROP_NAMES, PALETTE, repoRoot } from './support/palette';

const globals = readFileSync(join(repoRoot, 'app/globals.css'), 'utf8');

/**
 * Palette of the specification, §14 — quoted by hand on purpose. This is the
 * one file allowed to hold a second copy of these values, because this is the
 * check that `styles/tokens.css` says what the specification says; everything
 * else in the suite reads the palette out of the stylesheet
 * (`tests/support/palette.ts`).
 */
const SPEC_14 = {
  peach: '#F7E7DF',
  rose: '#F2D3D8',
  lilac: '#E4D0F3',
  sand: '#E8D8CF',
  ink: '#2C2326',
} as const;

describe('palette tokens', () => {
  for (const [name, hex] of Object.entries(SPEC_14)) {
    it(`--${name} is ${hex}`, () => {
      expect(PALETTE[name as keyof typeof SPEC_14]).toBe(hex);
    });
  }

  for (const background of BACKDROP_NAMES) {
    it(`ink text on --${background} reaches 4.5:1`, () => {
      expect(contrastRatio(SPEC_14.ink, SPEC_14[background])).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('components use tokens, not hex literals', () => {
  function tsxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return tsxFiles(path);
      return path.endsWith('.tsx') || path.endsWith('.css') ? [path] : [];
    });
  }

  it('has no hex colour anywhere under components/ or app/', () => {
    const offenders = [join(repoRoot, 'components'), join(repoRoot, 'app')]
      .flatMap(tsxFiles)
      .filter((path) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(path, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('keeps one source of truth: globals.css imports the tokens and redefines none', () => {
    expect(globals).toContain("@import '../styles/tokens.css';");
    expect(globals).not.toMatch(/--(peach|rose|lilac|sand|ink)\s*:/);
  });

  it('keeps one implementation of the WCAG maths, and it is lib/color/wcag', () => {
    function sources(dir: string): string[] {
      return readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) return sources(path);
        return /\.(ts|tsx)$/.test(path) ? [path] : [];
      });
    }

    /* 0.03928 and 0.7152 are the constants of the relative-luminance formula:
       wherever they appear, someone has written the formula again. */
    const offenders = [join(repoRoot, 'components'), join(repoRoot, 'app'), join(repoRoot, 'lib'), join(repoRoot, 'tests'), join(repoRoot, 'e2e')]
      .flatMap(sources)
      .filter((path) => !path.endsWith('tests/palette.test.ts')) // the guard names the constants
      .filter((path) => /0\.03928|0\.7152/.test(readFileSync(path, 'utf8')))
      .map((path) => path.slice(repoRoot.length));
    expect(offenders).toEqual(['lib/color/wcag.ts']);
  });
});
