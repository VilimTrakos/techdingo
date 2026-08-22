import { MAX_HEARTS, type HeartsState } from './progressTypes';

/** Jedno srce svaka 4 sata (Duolingo-stil regeneracija). */
export const HEART_REGEN_INTERVAL_MS = 4 * 60 * 60 * 1000;

/**
 * Lijena regeneracija: iz spremljenog stanja + trenutnog vremena izračunaj
 * stvarnu zalihu. Čista funkcija - poziva se i za prikaz (bez pisanja) i
 * prije svakog trošenja/dodavanja (tada se rezultat materijalizira u state).
 */
export function resolveHearts(hearts: HeartsState, now: Date = new Date()): HeartsState {
  if (hearts.balance >= MAX_HEARTS || hearts.lastRegenAtISO === null) {
    return { balance: Math.min(hearts.balance, MAX_HEARTS), lastRegenAtISO: null };
  }
  const lastRegenAt = new Date(hearts.lastRegenAtISO).getTime();
  const elapsed = now.getTime() - lastRegenAt;
  if (elapsed < HEART_REGEN_INTERVAL_MS) {
    return hearts;
  }
  const earned = Math.floor(elapsed / HEART_REGEN_INTERVAL_MS);
  const balance = Math.min(MAX_HEARTS, hearts.balance + earned);
  return {
    balance,
    lastRegenAtISO:
      balance >= MAX_HEARTS
        ? null
        : new Date(lastRegenAt + earned * HEART_REGEN_INTERVAL_MS).toISOString(),
  };
}

/** Potroši jedno srce (kriv odgovor u lekciji). Nikad ne ide ispod 0. */
export function spendHeart(hearts: HeartsState, now: Date = new Date()): HeartsState {
  const resolved = resolveHearts(hearts, now);
  const balance = Math.max(0, resolved.balance - 1);
  return {
    balance,
    // Regen sat kreće od trenutka kad je zaliha prvi put pala ispod maksimuma.
    lastRegenAtISO: resolved.lastRegenAtISO ?? now.toISOString(),
  };
}

/** Dodaj srca (nagrada za reklamu, testni refill). Kapa na MAX_HEARTS. */
export function grantHearts(hearts: HeartsState, amount: number, now: Date = new Date()): HeartsState {
  const resolved = resolveHearts(hearts, now);
  const balance = Math.min(MAX_HEARTS, resolved.balance + Math.max(0, amount));
  return {
    balance,
    lastRegenAtISO: balance >= MAX_HEARTS ? null : resolved.lastRegenAtISO,
  };
}

/** Milisekunde do sljedećeg regeneriranog srca, ili null ako je zaliha puna. */
export function msUntilNextHeart(hearts: HeartsState, now: Date = new Date()): number | null {
  const resolved = resolveHearts(hearts, now);
  if (resolved.balance >= MAX_HEARTS || resolved.lastRegenAtISO === null) return null;
  const nextAt = new Date(resolved.lastRegenAtISO).getTime() + HEART_REGEN_INTERVAL_MS;
  return Math.max(0, nextAt - now.getTime());
}
