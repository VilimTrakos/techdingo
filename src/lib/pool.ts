import type { Difficulty, Question } from '../types/question';
import { shuffle } from './shuffle';

export const MIN_SESSION_SIZE = 15;
export const MAX_SESSION_SIZE = 17;

/** Redoslijed progresije unutar sesije: lakše prema težem, Duolingo-stil. */
export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/** Nasumična veličina sesije u rasponu [15, 17]. */
export function randomSessionSize(): number {
  const span = MAX_SESSION_SIZE - MIN_SESSION_SIZE + 1;
  return MIN_SESSION_SIZE + Math.floor(Math.random() * span);
}

/** Podijeli `size` što ravnomjernije po tierovima; eventualni ostatak ide ranijim (lakšim) tierovima. */
function distributeEvenly(size: number, tiers: Difficulty[]): Record<Difficulty, number> {
  const base = Math.floor(size / tiers.length);
  let remainder = size - base * tiers.length;
  const result = {} as Record<Difficulty, number>;
  for (const tier of tiers) {
    result[tier] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return result;
}

/** Odabire do `count` pitanja iz `pool`, preferirajući ona koja nisu u `recentSet`. */
function pickUpTo(pool: Question[], recentSet: Set<string>, count: number): Question[] {
  if (count <= 0) return [];
  const fresh = shuffle(pool.filter((q) => !recentSet.has(q.id)));
  const picked = fresh.slice(0, count);
  if (picked.length < count) {
    const pickedIds = new Set(picked.map((q) => q.id));
    const remainder = shuffle(pool.filter((q) => !pickedIds.has(q.id)));
    picked.push(...remainder.slice(0, count - picked.length));
  }
  return picked;
}

/**
 * Odabire `size` pitanja iz `all`, izbjegavajući `recentIds` (pitanja iz
 * zadnje odigrane sesije te teme) kad god je to moguće, birajući proporcionalno
 * iz sve tri razine težine (easy/medium/hard) - ako neka razina nema dovoljno
 * pitanja, manjak se prebacuje na sljedeću (težu) razinu. Rezultat je poredan
 * easy -> medium -> hard (Duolingo-stil progresija unutar jedne sesije).
 * Ako cijela banka ima manje pitanja nego `size`, nikad ne baca - popuni što
 * može iz preostale banke (uključujući recentIds) i vrati manje od `size`.
 */
export function selectSessionPool(all: Question[], recentIds: string[], size: number): Question[] {
  const recentSet = new Set(recentIds);
  const byDifficulty: Record<Difficulty, Question[]> = { easy: [], medium: [], hard: [] };
  for (const q of all) {
    (byDifficulty[q.difficulty] ?? byDifficulty.medium).push(q);
  }

  const targets = distributeEvenly(size, DIFFICULTY_ORDER);
  const selected: Question[] = [];
  const usedIds = new Set<string>();
  let carryOver = 0;

  for (const tier of DIFFICULTY_ORDER) {
    const want = targets[tier] + carryOver;
    const availableInTier = byDifficulty[tier].filter((q) => !usedIds.has(q.id));
    const picked = pickUpTo(availableInTier, recentSet, want);
    for (const q of picked) usedIds.add(q.id);
    selected.push(...picked);
    carryOver = want - picked.length;
  }

  if (selected.length < size && selected.length < all.length) {
    const remainder = shuffle(all.filter((q) => !usedIds.has(q.id)));
    selected.push(...remainder.slice(0, size - selected.length));
  }

  return selected.sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]);
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
