import { describe, expect, it } from 'vitest';
import { mergeProgress, mergeStreak } from './mergeProgress';
import { createDefaultProgressState, type ProgressState } from './progressTypes';

describe('mergeStreak', () => {
  it('kad je jedna strana nikad-aktivna, pobjeđuje ona druga', () => {
    const empty = { current: 0, longest: 0, lastCompletedDateISO: null };
    const active = { current: 4, longest: 6, lastCompletedDateISO: '2026-01-10' };
    expect(mergeStreak(empty, active)).toEqual(active);
    expect(mergeStreak(active, empty)).toEqual(active);
  });

  it('isti zadnji dan (diff=0) uzima veći current, ne zbraja', () => {
    const a = { current: 3, longest: 3, lastCompletedDateISO: '2026-01-10' };
    const b = { current: 5, longest: 5, lastCompletedDateISO: '2026-01-10' };
    expect(mergeStreak(a, b)).toEqual({ current: 5, longest: 5, lastCompletedDateISO: '2026-01-10' });
  });

  it('uzastopni dani (diff=1) nastavljaju niz - NE gubi dane starije strane', () => {
    // Ovo je regresijski test za bug koji je review pronašao: "novija strana
    // pobjeđuje" bi ovdje dao current=2, gubeći 3 dana s uređaja A.
    const deviceA = { current: 3, longest: 3, lastCompletedDateISO: '2026-01-10' };
    const deviceB = { current: 2, longest: 2, lastCompletedDateISO: '2026-01-11' };
    expect(mergeStreak(deviceA, deviceB)).toEqual({ current: 5, longest: 5, lastCompletedDateISO: '2026-01-11' });
  });

  it('razmak veći od 1 dana - novija strana pobjeđuje (niz je stvarno prekinut)', () => {
    const deviceA = { current: 10, longest: 10, lastCompletedDateISO: '2026-01-01' };
    const deviceB = { current: 2, longest: 2, lastCompletedDateISO: '2026-01-20' };
    expect(mergeStreak(deviceA, deviceB)).toEqual({ current: 2, longest: 10, lastCompletedDateISO: '2026-01-20' });
  });
});

describe('mergeProgress', () => {
  function stateWith(overrides: Partial<ProgressState>): ProgressState {
    return { ...createDefaultProgressState(), ...overrides };
  }

  it('gost-napredak (bez cloud reda) se čuva u potpunosti - xpTotal je max', () => {
    const local = stateWith({ xpTotal: 150 });
    const remote = stateWith({ xpTotal: 40 });
    expect(mergeProgress(local, remote).xpTotal).toBe(150);
  });

  it('po-temi passCount/failCount/playCount su max, ne sum (idempotentnost)', () => {
    const local = stateWith({
      lessons: { sql: { passCount: 3, failCount: 1, recentQuestionIds: ['a'], struggledQuestionIds: [] } },
      scoreStrike: { sql: { bestScore: 500, bestAtISO: '2026-01-05T00:00:00Z', playCount: 2, recentQuestionIds: ['x'] } },
    });
    const remote = stateWith({
      lessons: { sql: { passCount: 5, failCount: 0, recentQuestionIds: ['b'], struggledQuestionIds: [] } },
      scoreStrike: { sql: { bestScore: 300, bestAtISO: '2026-01-01T00:00:00Z', playCount: 4, recentQuestionIds: ['y'] } },
    });
    const merged = mergeProgress(local, remote);
    expect(merged.lessons.sql).toEqual({ passCount: 5, failCount: 1, recentQuestionIds: ['b'], struggledQuestionIds: [] });
    expect(merged.scoreStrike.sql).toEqual({ bestScore: 500, bestAtISO: '2026-01-05T00:00:00Z', playCount: 4, recentQuestionIds: ['y'] });
  });

  it('spajanje istog stanja sa samim sobom je no-op na vrijednostima (idempotentno)', () => {
    const state = stateWith({
      xpTotal: 200,
      streak: { current: 3, longest: 5, lastCompletedDateISO: '2026-01-10' },
      lessons: { sql: { passCount: 2, failCount: 1, recentQuestionIds: ['a'], struggledQuestionIds: [] } },
    });
    const merged = mergeProgress(state, state);
    expect(merged.xpTotal).toBe(200);
    expect(merged.streak.current).toBe(3);
    expect(merged.lessons.sql).toEqual(state.lessons.sql);
  });

  it('teme koje postoje samo na jednoj strani se čuvaju u potpunosti', () => {
    const local = stateWith({ lessons: { sql: { passCount: 1, failCount: 0, recentQuestionIds: [], struggledQuestionIds: [] } } });
    const remote = stateWith({ lessons: { frontend: { passCount: 2, failCount: 0, recentQuestionIds: [], struggledQuestionIds: [] } } });
    const merged = mergeProgress(local, remote);
    expect(Object.keys(merged.lessons).sort()).toEqual(['frontend', 'sql']);
  });
});
