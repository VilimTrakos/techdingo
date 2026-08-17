import type { ProgressStateV1 } from './progressTypes';
import { applyStreak } from './streak';
import { xpForLesson, xpForScoreStrike } from '../lib/xp';

export interface LessonResultInput {
  passed: boolean;
  correctCount: number;
  questionIds: string[];
}

/** Čista funkcija: vraća NOVO stanje (ne mutira ulaz), za lakše testiranje i predvidljiv React re-render. */
export function recordLessonResult(
  state: ProgressStateV1,
  topicId: string,
  input: LessonResultInput,
  now: Date = new Date(),
): ProgressStateV1 {
  const existing = state.lessons[topicId] ?? { passCount: 0, failCount: 0, recentQuestionIds: [] };

  const lessons = {
    ...state.lessons,
    [topicId]: {
      passCount: existing.passCount + (input.passed ? 1 : 0),
      failCount: existing.failCount + (input.passed ? 0 : 1),
      recentQuestionIds: input.questionIds,
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
  state: ProgressStateV1;
  isNewBest: boolean;
}

/**
 * Score Strike nema fail-stanje (svaki dovršeni run se računa kao "odigrana
 * sesija" za streak i XP svrhe) - jedino best score se ažurira uvjetno.
 */
export function recordScoreStrikeResult(
  state: ProgressStateV1,
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

  const newState: ProgressStateV1 = {
    ...state,
    xpTotal: state.xpTotal + xpGained,
    streak,
    scoreStrike,
    updatedAtISO: now.toISOString(),
  };

  return { state: newState, isNewBest };
}
