import type { Question } from '../types/question';
import { shuffle } from './shuffle';

export const MIN_SESSION_SIZE = 15;
export const MAX_SESSION_SIZE = 17;

/** Nasumična veličina sesije u rasponu [15, 17]. */
export function randomSessionSize(): number {
  const span = MAX_SESSION_SIZE - MIN_SESSION_SIZE + 1;
  return MIN_SESSION_SIZE + Math.floor(Math.random() * span);
}

/**
 * Odabire `size` pitanja iz `all`, izbjegavajući `recentIds` (pitanja iz
 * zadnje odigrane sesije te teme) kad god je to moguće. Ako banka nema
 * dovoljno "svježih" pitanja, popuni ostatak iz cijele banke (uključujući
 * recentIds) - nikad ne baca, samo vrati manje od `size` ako banka ima
 * manje pitanja nego što je traženo.
 */
export function selectSessionPool(all: Question[], recentIds: string[], size: number): Question[] {
  const recentSet = new Set(recentIds);
  const fresh = shuffle(all.filter((q) => !recentSet.has(q.id)));
  const selected = fresh.slice(0, size);

  if (selected.length < size && selected.length < all.length) {
    const selectedIds = new Set(selected.map((q) => q.id));
    const remainder = shuffle(all.filter((q) => !selectedIds.has(q.id)));
    selected.push(...remainder.slice(0, size - selected.length));
  }

  return selected;
}

export interface ShuffledOptions {
  options: string[];
  correctIndex: number;
}

/** Miješa redoslijed opcija za jedno pitanje; ne perzistira se, računa se po sesiji. */
export function shuffleOptions(question: Question): ShuffledOptions {
  const indices = shuffle([0, 1, 2, 3]);
  const options = indices.map((i) => question.options[i]);
  const correctIndex = indices.indexOf(question.correctIndex);
  return { options, correctIndex };
}
