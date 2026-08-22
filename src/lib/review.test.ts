import { describe, expect, it } from 'vitest';
import { collectStruggledQuestions, countStruggledQuestions } from './review';
import { TOPICS } from '../data/topics';
import { createDefaultProgressState, type ProgressState } from '../state/progressTypes';

function stateWithStruggled(byKey: Record<string, string[]>): ProgressState {
  const base = createDefaultProgressState();
  const lessons: ProgressState['lessons'] = {};
  for (const [key, ids] of Object.entries(byKey)) {
    lessons[key] = {
      passCount: 1,
      failCount: 1,
      recentQuestionIds: [],
      struggledQuestionIds: ids,
    };
  }
  return { ...base, lessons };
}

const realIds = TOPICS.flatMap((t) => t.questions.slice(0, 3).map((q) => q.id));

describe('collectStruggledQuestions', () => {
  it('prazno stanje daje prazan popis', () => {
    expect(collectStruggledQuestions(createDefaultProgressState())).toEqual([]);
  });

  it('skuplja pitanja iz više lekcijskih ključeva odjednom', () => {
    const state = stateWithStruggled({
      sql: [realIds[0]],
      'sql/osnove-upita': [realIds[1]],
      frontend: [realIds[3]],
    });
    const found = collectStruggledQuestions(state).map((q) => q.id);
    expect(found).toHaveLength(3);
    expect(found).toEqual(expect.arrayContaining([realIds[0], realIds[1], realIds[3]]));
  });

  it('deduplicira isti id zabilježen pod više ključeva', () => {
    const state = stateWithStruggled({
      sql: [realIds[0]],
      'sql/osnove-upita': [realIds[0]],
    });
    expect(collectStruggledQuestions(state)).toHaveLength(1);
  });

  it('tiho preskače id-jeve kojih više nema u banci pitanja', () => {
    const state = stateWithStruggled({ sql: ['ne-postoji-vise', realIds[0]] });
    const found = collectStruggledQuestions(state).map((q) => q.id);
    expect(found).toEqual([realIds[0]]);
  });

  it('countStruggledQuestions broji isto što collect vraća', () => {
    const state = stateWithStruggled({ sql: [realIds[0], realIds[1]], frontend: [realIds[3]] });
    expect(countStruggledQuestions(state)).toBe(collectStruggledQuestions(state).length);
  });
});
