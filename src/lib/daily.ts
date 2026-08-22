import type { Question } from '../types/question';

export const DAILY_CHALLENGE_SIZE = 10;

/** FNV-1a hash stringa u 32-bitni seed. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 - mali deterministički PRNG, dovoljan za miješanje pitanja. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministički odabir pitanja za dnevni izazov: isti datum (lokalni
 * YYYY-MM-DD) + ista banka pitanja = isti skup i redoslijed za SVE igrače,
 * bez servera. Sortiranje po id-u prije miješanja uklanja ovisnost o
 * redoslijedu u JSON datotekama.
 */
export function selectDailyQuestions(
  dateISO: string,
  all: Question[],
  size: number = DAILY_CHALLENGE_SIZE,
): Question[] {
  const rng = mulberry32(hashString(`techdingo-daily-${dateISO}`));
  const pool = [...all].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(size, pool.length));
}
