import { daysBetween, toLocalDateISO } from '../state/streak';
import type { ConceptMastery } from '../state/progressTypes';

/**
 * Leitner kutije: razmak do sljedećeg ponavljanja raste sa svakim točnim
 * odgovorom. Indeks = box, vrijednost = koliko dana čekati prije nego koncept
 * ponovno dospije.
 *
 * Box 0 (promašeno ili neviđeno) dospijeva odmah - zato 0 dana.
 * Box 5 je "naučeno": i dalje se vraća, samo rijetko, da ne ispari.
 */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35];
export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

/** Novi koncept: nije viđen, dospijeva odmah. */
export function initialMastery(nowISO: string): ConceptMastery {
  return { box: 0, lastSeenDateISO: nowISO };
}

/**
 * Primijeni jedan odgovor na koncept.
 * Točno -> viši box (dulji razmak). Krivo -> natrag na 0 (uči se iznova).
 *
 * Vraćanje na 0 umjesto box-1 je namjerno: ako si pogriješio, prethodni
 * "znam ovo" bio je pogodak, a ne znanje.
 */
export function applyAnswer(
  mastery: ConceptMastery | undefined,
  correct: boolean,
  now: Date = new Date(),
): ConceptMastery {
  const todayISO = toLocalDateISO(now);
  const currentBox = mastery?.box ?? 0;
  return {
    box: correct ? Math.min(MAX_BOX, currentBox + 1) : 0,
    lastSeenDateISO: todayISO,
  };
}

/** Je li koncept dospio za ponavljanje? Neviđen koncept uvijek jest. */
export function isDue(mastery: ConceptMastery | undefined, now: Date = new Date()): boolean {
  if (!mastery) return true;
  return daysOverdue(mastery, now) >= 0;
}

/**
 * Koliko je dana PROŠLO preko roka. Negativno = još nije dospjelo.
 * Koristi se za sortiranje: najviše zakašnjelo ide prvo.
 */
export function daysOverdue(mastery: ConceptMastery, now: Date = new Date()): number {
  const elapsed = daysBetween(mastery.lastSeenDateISO, toLocalDateISO(now));
  const required = BOX_INTERVAL_DAYS[Math.min(mastery.box, MAX_BOX)];
  return elapsed - required;
}

/** Koncept se smatra naučenim kad dosegne zadnju kutiju. */
export function isMastered(mastery: ConceptMastery | undefined): boolean {
  return (mastery?.box ?? 0) >= MAX_BOX;
}
