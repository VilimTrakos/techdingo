import { describe, expect, it } from 'vitest';
import { UNITS, unitProgressKey } from '../data/units';
import { createDefaultProgressState, type TopicLessonProgress } from '../state/progressTypes';
import { ACHIEVEMENTS } from './achievements';

const lessonProgress: TopicLessonProgress = {
  passCount: 1,
  failCount: 0,
  recentQuestionIds: [],
  struggledQuestionIds: [],
};

function achievement(id: string) {
  const found = ACHIEVEMENTS.find((entry) => entry.id === id);
  if (!found) throw new Error(`Nedostaje značka ${id}`);
  return found;
}

describe('ACHIEVEMENTS', () => {
  it('ima jedinstvene stabilne id-jeve', () => {
    const ids = ACHIEVEMENTS.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
  });

  it('XP i streak značke koriste trajne pragove', () => {
    const state = createDefaultProgressState();
    state.xpTotal = 500;
    state.streak.current = 0;
    state.streak.longest = 7;

    expect(achievement('xp-u-zamahu').earned(state)).toBe(true);
    expect(achievement('xp-legenda').earned(state)).toBe(false);
    expect(achievement('niz-sedam-dana').earned(state)).toBe(true);
  });

  it('SQL majstor traži prolaz svake SQL cjeline', () => {
    const state = createDefaultProgressState();
    for (const unit of UNITS.sql) {
      state.lessons[unitProgressKey('sql', unit.id)] = { ...lessonProgress };
    }

    expect(achievement('sql-majstor').earned(state)).toBe(true);
    delete state.lessons[unitProgressKey('sql', UNITS.sql[0].id)];
    expect(achievement('sql-majstor').earned(state)).toBe(false);
  });

  it('prepoznaje Score Strike i dnevni izazov', () => {
    const state = createDefaultProgressState();
    state.scoreStrike.mixed = {
      bestScore: 1_200,
      bestAtISO: '2026-08-22T10:00:00.000Z',
      playCount: 2,
      recentQuestionIds: [],
    };
    state.dailyChallenge.lastPlayedDateISO = '2026-08-22';

    expect(achievement('prvi-score-strike').earned(state)).toBe(true);
    expect(achievement('score-strike-tisucu').earned(state)).toBe(true);
    expect(achievement('dnevni-izazov').earned(state)).toBe(true);
  });
});
