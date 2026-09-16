import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url).pathname;
/** The tokens live in one place: styles/tokens.css, imported by globals.css. */
const css = readFileSync(join(root, 'styles/tokens.css'), 'utf8');
const globals = readFileSync(join(root, 'app/globals.css'), 'utf8');

/** Palette of the specification, §14 — the source of truth for these values. */
const PALETTE = {
  peach: '#F7E7DF',
  rose: '#F2D3D8',
  lilac: '#E4D0F3',
  sand: '#E8D8CF',
  ink: '#2C2326',
} as const;

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`token --${name} is not defined in styles/tokens.css`);
  return match[1].toUpperCase();
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

describe('palette tokens', () => {
  for (const [name, hex] of Object.entries(PALETTE)) {
    it(`--${name} is ${hex}`, () => {
      expect(token(name)).toBe(hex);
    });
  }

  for (const background of ['peach', 'rose', 'lilac', 'sand'] as const) {
    it(`ink text on --${background} reaches 4.5:1`, () => {
      expect(contrast(PALETTE.ink, PALETTE[background])).toBeGreaterThanOrEqual(4.5);
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
    const offenders = [join(root, 'components'), join(root, 'app')]
      .flatMap(tsxFiles)
      .filter((path) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(path, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('keeps one source of truth: globals.css imports the tokens and redefines none', () => {
    expect(globals).toContain("@import '../styles/tokens.css';");
    expect(globals).not.toMatch(/--(peach|rose|lilac|sand|ink)\s*:/);
  });
});
