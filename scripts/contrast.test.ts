import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Živi u scripts/, ne u src/: čita datoteku s diska, a to je node posao.
// `import ... ?raw` ovdje ne radi jer vitest CSS uvoze zamjenjuje praznim
// stringom, pa bi test tiho prolazio nad ničim.
const CSS = readFileSync(join(import.meta.dirname, '..', 'src', 'index.css'), 'utf-8');

/**
 * Čuva kontrast boja u `src/index.css`.
 *
 * Zašto postoji: audit 2026-08-30 našao je 61 element ispod WCAG AA praga,
 * uključujući glavni gumb aplikacije (bijelo na zelenoj, 2,7:1) i prigušeni
 * tekst na stranici statistike (2,5:1). Sve je bilo u tokenima, pa se ista
 * greška vraća čim netko "malo posvijetli" boju.
 *
 * Prag je 4,5:1 (AA za tekst normalne veličine), a ciljne vrijednosti nose
 * rezervu do ~4,8 da granični slučaj ne padne na zaokruživanju.
 */
function token(name: string): string {
  const m = CSS.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`Token --color-${name} ne postoji u index.css`);
  return m[1];
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

/** Podloge na kojima aplikacija stvarno prikazuje tekst. */
const SURFACES = ['#ffffff', '#f8faf7', '#f0f4ed', '#f2fff4', '#dbfce1', '#eef2ff', '#fef3c6', '#fff1f2', '#f5f3ff'];

describe('kontrast boja', () => {
  it('bijeli tekst na primarnom gumbu prolazi AA', () => {
    // brand-500 je namjerno presvijetla za bijeli tekst; pune plohe s bijelim
    // tekstom koriste brand-action. Ako netko gumb vrati na brand-500, pada.
    expect(contrast('#ffffff', token('brand-action'))).toBeGreaterThanOrEqual(AA);
    expect(contrast('#ffffff', token('brand-action-dark'))).toBeGreaterThanOrEqual(AA);
  });

  it('primarni gumb u CSS-u stvarno koristi brand-action, ne brand-500', () => {
    const rule = CSS.match(/\.game-button-primary\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('var(--color-brand-action)');
    expect(rule).not.toContain('var(--color-brand-500)');
  });

  it.each(['ink-600', 'ink-400', 'brand-600'])(
    'boja teksta %s prolazi AA na svakoj podlozi',
    (name) => {
      const color = token(name);
      for (const surface of SURFACES) {
        expect(contrast(color, surface), `${name} (${color}) na ${surface}`).toBeGreaterThanOrEqual(AA);
      }
    },
  );

  it('glavna boja teksta ima široku rezervu', () => {
    expect(contrast(token('ink-950'), '#ffffff')).toBeGreaterThan(12);
  });
});
