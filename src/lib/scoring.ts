import type { QuestionKind } from '../types/question';

export const SCORE_STRIKE_BASE_POINTS = 100;
export const SCORE_STRIKE_MAX_SPEED_BONUS = 50;
export const SCORE_STRIKE_COMBO_STEP = 0.1;
export const SCORE_STRIKE_COMBO_CAP = 10;
export const SCORE_STRIKE_QUESTION_TIME_MS = 10_000;

/** Složenije vrste pitanja dobivaju više vremena po pitanju. */
const KIND_TIME_MS: Record<QuestionKind, number> = {
  single: SCORE_STRIKE_QUESTION_TIME_MS,
  multi: 15_000,
  fill: 20_000,
  order: 20_000,
};

export function questionTimeMs(kind: QuestionKind): number {
  return KIND_TIME_MS[kind] ?? SCORE_STRIKE_QUESTION_TIME_MS;
}

/** Multiplikator na temelju combo brojača PRIJE ovog odgovora (raste 10% po uzastopnom točnom, kapa na +100%). */
export function comboMultiplier(comboBeforeAnswer: number): number {
  return 1 + SCORE_STRIKE_COMBO_STEP * Math.min(comboBeforeAnswer, SCORE_STRIKE_COMBO_CAP);
}

/** Bonus 0-50 bodova linearno prema preostalom vremenu (odgovor odmah = pun bonus). */
export function speedBonus(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
  return Math.round(ratio * SCORE_STRIKE_MAX_SPEED_BONUS);
}

export interface ScoreStrikeAnswerResult {
  pointsAwarded: number;
  newCombo: number;
}

/** Krivi odgovor ili istek vremena = 0 bodova i reset comba. Točan = baza+bonus puta multiplikator. */
export function scoreAnswer(params: {
  correct: boolean;
  remainingMs: number;
  totalMs: number;
  comboBeforeAnswer: number;
}): ScoreStrikeAnswerResult {
  const { correct, remainingMs, totalMs, comboBeforeAnswer } = params;
  if (!correct) {
    return { pointsAwarded: 0, newCombo: 0 };
  }
  const multiplier = comboMultiplier(comboBeforeAnswer);
  const bonus = speedBonus(remainingMs, totalMs);
  const pointsAwarded = Math.round((SCORE_STRIKE_BASE_POINTS + bonus) * multiplier);
  return { pointsAwarded, newCombo: comboBeforeAnswer + 1 };
}
