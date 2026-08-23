import type { ConceptMastery } from '../state/progressTypes';

/**
 * Leitner kutije mjerene u LEKCIJAMA, ne u danima.
 *
 * Razmak u danima je za ovu aplikaciju bio pogrešna mjera: igrač koji odigra
 * pet lekcija u jednom sjedenju ne bi u njima vidio ni jedno ponavljanje, a
 * onaj koji igra jednom tjedno bio bi zatrpan. Brojač lekcija prati stvarni
 * ritam učenja - ponavljanje dolazi nakon N odigranih lekcija, kad god one
 * bile odigrane.
 *
 * Indeks = box, vrijednost = za koliko se lekcija koncept vraća.
 *
 * Box 0 (promašeno) = 1, dakle koncept se vraća već u SLJEDEĆOJ lekciji. To
 * je namjerno: ono što nisi znao vraća se lekciju za lekcijom dok ne sjedne.
 *
 * Box 5 je "naučeno": i dalje se vraća, samo rijetko, da ne ispari.
 *
 * Praktično, uz točan odgovor svaki put, koncept se vidi u lekcijama
 * 1, 3, 6, 11, 19 - pet susreta u prva tri tjedna svakodnevnog igranja.
 */
export const BOX_INTERVAL_LESSONS = [1, 2, 3, 5, 8, 13];
export const MAX_BOX = BOX_INTERVAL_LESSONS.length - 1;

/**
 * U kojoj se lekciji (računajući od prve u kojoj je koncept viđen) koncept
 * smatra naučenim ako se svaki put pogodi. Izvedeno iz razmaka - ne mijenjaj ručno.
 */
export const LESSONS_TO_MASTERY =
  1 + BOX_INTERVAL_LESSONS.slice(1, MAX_BOX).reduce((sum, gap) => sum + gap, 0);

/** Novi koncept: nije viđen, dospijeva odmah. */
export function initialMastery(lessonCounter: number): ConceptMastery {
  return { box: 0, lastSeenLesson: lessonCounter };
}

/**
 * Primijeni jedan odgovor na koncept.
 * Točno -> viši box (dulji razmak). Krivo -> natrag na 0 (uči se iznova).
 *
 * Vraćanje na 0 umjesto box-1 je namjerno: ako si pogriješio, prethodni
 * "znam ovo" bio je pogodak, a ne znanje.
 *
 * `lessonCounter` je broj DOVRŠENIH sesija u trenutku odgovora, dakle
 * vrijednost PRIJE inkrementa za tekuću sesiju. Zbog toga je u sljedećoj
 * lekciji proteklo točno 1, pa razmak 1 znači "vraća se odmah iduću lekciju".
 */
export function applyAnswer(
  mastery: ConceptMastery | undefined,
  correct: boolean,
  lessonCounter: number,
): ConceptMastery {
  const currentBox = mastery?.box ?? 0;
  return {
    box: correct ? Math.min(MAX_BOX, currentBox + 1) : 0,
    lastSeenLesson: lessonCounter,
  };
}

/** Je li koncept dospio za ponavljanje? Neviđen koncept uvijek jest. */
export function isDue(mastery: ConceptMastery | undefined, lessonCounter: number): boolean {
  if (!mastery) return true;
  return lessonsOverdue(mastery, lessonCounter) >= 0;
}

/**
 * Koliko je LEKCIJA prošlo preko roka. Negativno = još nije dospjelo.
 * Koristi se za sortiranje: najviše zakašnjelo ide prvo.
 */
export function lessonsOverdue(mastery: ConceptMastery, lessonCounter: number): number {
  const elapsed = lessonCounter - mastery.lastSeenLesson;
  const required = BOX_INTERVAL_LESSONS[Math.min(Math.max(mastery.box, 0), MAX_BOX)];
  return elapsed - required;
}

/** Koncept se smatra naučenim kad dosegne zadnju kutiju. */
export function isMastered(mastery: ConceptMastery | undefined): boolean {
  return (mastery?.box ?? 0) >= MAX_BOX;
}
