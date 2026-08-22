import { describe, expect, it } from 'vitest';
import { createDefaultProgressState } from './progressTypes';
import { recordLessonResult, recordReviewResult, recordScoreStrikeResult } from './progress';

describe('recordLessonResult', () => {
  it('prolaz (passed) dodaje XP, povećava passCount i produžuje streak', () => {
    const state = createDefaultProgressState();
    const now = new Date('2026-02-01T10:00:00');
    const next = recordLessonResult(state, 'sql', { passed: true, correctCount: 12, questionIds: ['a', 'b'], wrongQuestionIds: [] }, now);

    expect(next.xpTotal).toBe(120);
    expect(next.lessons.sql).toEqual({ passCount: 1, failCount: 0, recentQuestionIds: ['a', 'b'], struggledQuestionIds: [] });
    expect(next.streak.current).toBe(1);
  });

  it('neuspjeh (failed) ne daje XP niti mijenja streak', () => {
    const state = createDefaultProgressState();
    const now = new Date('2026-02-01T10:00:00');
    const next = recordLessonResult(state, 'sql', { passed: false, correctCount: 4, questionIds: ['a'], wrongQuestionIds: ['a'] }, now);

    expect(next.xpTotal).toBe(0);
    expect(next.lessons.sql).toEqual({ passCount: 0, failCount: 1, recentQuestionIds: ['a'], struggledQuestionIds: ['a'] });
    expect(next.streak.current).toBe(0);
  });

  it('ne mutira ulazno stanje', () => {
    const state = createDefaultProgressState();
    const now = new Date('2026-02-01T10:00:00');
    recordLessonResult(state, 'sql', { passed: true, correctCount: 5, questionIds: [], wrongQuestionIds: [] }, now);
    expect(state.xpTotal).toBe(0);
    expect(state.lessons).toEqual({});
  });
});

describe('recordScoreStrikeResult', () => {
  it('prvi odigrani run postavlja bestScore i vraća isNewBest: true', () => {
    const state = createDefaultProgressState();
    const now = new Date('2026-02-01T10:00:00');
    const { state: next, isNewBest } = recordScoreStrikeResult(state, 'frontend', { score: 500, questionIds: ['x'] }, now);

    expect(isNewBest).toBe(true);
    expect(next.scoreStrike.frontend.bestScore).toBe(500);
    expect(next.scoreStrike.frontend.playCount).toBe(1);
    expect(next.xpTotal).toBe(25);
  });

  it('niži score ne mijenja bestScore, ali uvijek broji playCount/XP/streak', () => {
    const state = createDefaultProgressState();
    const now = new Date('2026-02-01T10:00:00');
    const { state: afterFirst } = recordScoreStrikeResult(state, 'frontend', { score: 500, questionIds: [] }, now);
    const { state: afterSecond, isNewBest } = recordScoreStrikeResult(
      afterFirst,
      'frontend',
      { score: 200, questionIds: [] },
      new Date('2026-02-02T10:00:00'),
    );

    expect(isNewBest).toBe(false);
    expect(afterSecond.scoreStrike.frontend.bestScore).toBe(500);
    expect(afterSecond.scoreStrike.frontend.playCount).toBe(2);
    expect(afterSecond.streak.current).toBe(2);
  });

  it('nema fail-stanje - svaki dovršeni run se računa za streak', () => {
    const state = createDefaultProgressState();
    const { state: next } = recordScoreStrikeResult(state, 'mixed', { score: 0, questionIds: [] }, new Date('2026-02-01T10:00:00'));
    expect(next.streak.current).toBe(1);
  });
});

describe('recordReviewResult', () => {
  it('briše točno odgovorena pitanja iz SVIH lekcijskih ključeva', () => {
    const base = createDefaultProgressState();
    const state = {
      ...base,
      lessons: {
        sql: { passCount: 1, failCount: 1, recentQuestionIds: [], struggledQuestionIds: ['a', 'b'] },
        'sql/osnove': { passCount: 1, failCount: 0, recentQuestionIds: [], struggledQuestionIds: ['a', 'c'] },
      },
    };
    const next = recordReviewResult(state, { correctQuestionIds: ['a'], correctCount: 1 }, new Date('2026-02-01T10:00:00'));
    expect(next.lessons.sql.struggledQuestionIds).toEqual(['b']);
    expect(next.lessons['sql/osnove'].struggledQuestionIds).toEqual(['c']);
  });

  it('krivo odgovorena ostaju na popisu', () => {
    const base = createDefaultProgressState();
    const state = {
      ...base,
      lessons: {
        sql: { passCount: 1, failCount: 1, recentQuestionIds: [], struggledQuestionIds: ['a', 'b'] },
      },
    };
    const next = recordReviewResult(state, { correctQuestionIds: [], correctCount: 0 }, new Date('2026-02-01T10:00:00'));
    expect(next.lessons.sql.struggledQuestionIds).toEqual(['a', 'b']);
  });

  it('dodaje 10 XP po ispravljenom pitanju i produžuje niz', () => {
    const state = createDefaultProgressState();
    const next = recordReviewResult(state, { correctQuestionIds: ['a', 'b'], correctCount: 2 }, new Date('2026-02-01T10:00:00'));
    expect(next.xpTotal).toBe(20);
    expect(next.streak.current).toBe(1);
  });

  it('ne mutira ulazno stanje', () => {
    const base = createDefaultProgressState();
    const state = {
      ...base,
      lessons: { sql: { passCount: 1, failCount: 1, recentQuestionIds: [], struggledQuestionIds: ['a'] } },
    };
    recordReviewResult(state, { correctQuestionIds: ['a'], correctCount: 1 }, new Date('2026-02-01T10:00:00'));
    expect(state.lessons.sql.struggledQuestionIds).toEqual(['a']);
  });
});
