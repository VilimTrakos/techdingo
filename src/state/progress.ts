import type { ProgressState } from './progressTypes';
import { grantHearts, resolveHearts, spendHeart } from './hearts';
import { applyStreak, toLocalDateISO } from './streak';
import { xpForLesson, xpForScoreStrike } from '../lib/xp';

/** Koliko krivo odgovorenih pitanja pamtimo po ključu za prioritetno ponavljanje. */
const MAX_STRUGGLED_IDS = 12;

export interface LessonResultInput {
  passed: boolean;
  correctCount: number;
  questionIds: string[];
  /** Pitanja krivo odgovorena u ovoj sesiji - ulaze u prioritetno ponavljanje. */
  wrongQuestionIds: string[];
}

/** Čista funkcija: vraća NOVO stanje (ne mutira ulaz), za lakše testiranje i predvidljiv React re-render. */
export function recordLessonResult(
  state: ProgressState,
  lessonKey: string,
  input: LessonResultInput,
  now: Date = new Date(),
): ProgressState {
  const existing = state.lessons[lessonKey] ?? {
    passCount: 0,
    failCount: 0,
    recentQuestionIds: [],
    struggledQuestionIds: [],
  };

  // Krivo odgovorena pitanja idu na početak liste ponavljanja; točno
  // odgovorena ispadaju iz nje (naučeno). Bez duplikata, ograničene duljine.
  const answeredCorrectly = new Set(
    input.questionIds.filter((id) => !input.wrongQuestionIds.includes(id)),
  );
  const struggledQuestionIds = [
    ...new Set([
      ...input.wrongQuestionIds,
      ...existing.struggledQuestionIds.filter((id) => !answeredCorrectly.has(id)),
    ]),
  ].slice(0, MAX_STRUGGLED_IDS);

  const lessons = {
    ...state.lessons,
    [lessonKey]: {
      passCount: existing.passCount + (input.passed ? 1 : 0),
      failCount: existing.failCount + (input.passed ? 0 : 1),
      recentQuestionIds: input.questionIds,
      struggledQuestionIds,
    },
  };

  const xpGained = xpForLesson(input.passed, input.correctCount);
  const streak = input.passed ? applyStreak(state.streak, now) : state.streak;

  return {
    ...state,
    xpTotal: state.xpTotal + xpGained,
    streak,
    lessons,
    updatedAtISO: now.toISOString(),
  };
}

export interface ScoreStrikeResultInput {
  score: number;
  questionIds: string[];
}

export interface ScoreStrikeRecordOutcome {
  state: ProgressState;
  isNewBest: boolean;
}

/**
 * Score Strike nema fail-stanje (svaki dovršeni run se računa kao "odigrana
 * sesija" za streak i XP svrhe) - jedino best score se ažurira uvjetno.
 */
export function recordScoreStrikeResult(
  state: ProgressState,
  topicIdOrMixed: string,
  input: ScoreStrikeResultInput,
  now: Date = new Date(),
): ScoreStrikeRecordOutcome {
  const existing = state.scoreStrike[topicIdOrMixed] ?? {
    bestScore: 0,
    bestAtISO: now.toISOString(),
    playCount: 0,
    recentQuestionIds: [],
  };

  const isNewBest = input.score > existing.bestScore;

  const scoreStrike = {
    ...state.scoreStrike,
    [topicIdOrMixed]: {
      bestScore: isNewBest ? input.score : existing.bestScore,
      bestAtISO: isNewBest ? now.toISOString() : existing.bestAtISO,
      playCount: existing.playCount + 1,
      recentQuestionIds: input.questionIds,
    },
  };

  const xpGained = xpForScoreStrike(input.score);
  const streak = applyStreak(state.streak, now);

  const newState: ProgressState = {
    ...state,
    xpTotal: state.xpTotal + xpGained,
    streak,
    scoreStrike,
    updatedAtISO: now.toISOString(),
  };

  return { state: newState, isNewBest };
}

/** Potroši jedno srce (kriv odgovor u lekciji). */
export function spendHeartOnState(state: ProgressState, now: Date = new Date()): ProgressState {
  return { ...state, hearts: spendHeart(state.hearts, now), updatedAtISO: now.toISOString() };
}

/** Dodaj srca (nagrada za reklamu = 1, testni refill = MAX). */
export function grantHeartsOnState(
  state: ProgressState,
  amount: number,
  now: Date = new Date(),
): ProgressState {
  return {
    ...state,
    hearts: grantHearts(state.hearts, amount, now),
    updatedAtISO: now.toISOString(),
  };
}

/** Materijaliziraj lijenu regeneraciju u state (npr. pri pokretanju lekcije). */
export function resolveHeartsOnState(state: ProgressState, now: Date = new Date()): ProgressState {
  const resolved = resolveHearts(state.hearts, now);
  if (
    resolved.balance === state.hearts.balance &&
    resolved.lastRegenAtISO === state.hearts.lastRegenAtISO
  ) {
    return state;
  }
  return { ...state, hearts: resolved, updatedAtISO: now.toISOString() };
}

export interface DailyChallengeResultInput {
  score: number;
}

/** Zabilježi odigran dnevni izazov (jednom dnevno - poziva se tek nakon dovršetka). */
export function recordDailyChallengeResult(
  state: ProgressState,
  input: DailyChallengeResultInput,
  now: Date = new Date(),
): ProgressState {
  return {
    ...state,
    xpTotal: state.xpTotal + xpForScoreStrike(input.score),
    streak: applyStreak(state.streak, now),
    dailyChallenge: {
      lastPlayedDateISO: toLocalDateISO(now),
      lastScore: input.score,
      bestScore: Math.max(state.dailyChallenge.bestScore, input.score),
    },
    updatedAtISO: now.toISOString(),
  };
}

export interface ReviewResultInput {
  /** Pitanja točno odgovorena u ponavljanju - brišu se iz liste za ponavljanje. */
  correctQuestionIds: string[];
  correctCount: number;
}

/**
 * Zabilježi sesiju ponavljanja grešaka. Za razliku od lekcije, ovdje pitanja
 * dolaze iz VIŠE lekcijskih ključeva odjednom, pa točno odgovorena moramo
 * ukloniti iz svakog ključa u kojem se nalaze (ista greška može biti
 * zabilježena i pod temom i pod cjelinom).
 *
 * Krivo odgovorena ostaju gdje jesu - već su na popisu, nema ih smisla
 * duplirati ni premještati.
 */
export function recordReviewResult(
  state: ProgressState,
  input: ReviewResultInput,
  now: Date = new Date(),
): ProgressState {
  const learned = new Set(input.correctQuestionIds);

  const lessons: ProgressState['lessons'] = {};
  for (const [key, lesson] of Object.entries(state.lessons)) {
    const remaining = lesson.struggledQuestionIds.filter((id) => !learned.has(id));
    lessons[key] =
      remaining.length === lesson.struggledQuestionIds.length
        ? lesson
        : { ...lesson, struggledQuestionIds: remaining };
  }

  return {
    ...state,
    xpTotal: state.xpTotal + xpForLesson(true, input.correctCount),
    streak: applyStreak(state.streak, now),
    lessons,
    updatedAtISO: now.toISOString(),
  };
}
