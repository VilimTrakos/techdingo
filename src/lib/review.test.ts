import { describe, expect, it } from 'vitest';
import questionIndex from 'virtual:question-index';
import {
  collectStruggledQuestionIds,
  collectStruggledQuestions,
  countStruggledQuestions,
} from './review';
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

const sqlIds = questionIndex.sql.slice(0, 3).map(([id]) => id);
const frontendIds = questionIndex.frontend.slice(0, 2).map(([id]) => id);

describe('collectStruggledQuestions', () => {
  it('prazno stanje daje prazan popis', async () => {
    await expect(collectStruggledQuestions(createDefaultProgressState())).resolves.toEqual([]);
  });

  it('skuplja pitanja iz više lekcijskih ključeva odjednom', async () => {
    const state = stateWithStruggled({
      sql: [sqlIds[0]],
      'sql/osnove-upita': [sqlIds[1]],
      frontend: [frontendIds[0]],
    });
    const found = (await collectStruggledQuestions(state)).map((q) => q.id);
    expect(found).toHaveLength(3);
    expect(found).toEqual(expect.arrayContaining([sqlIds[0], sqlIds[1], frontendIds[0]]));
  });

  it('deduplicira isti id zabilježen pod više ključeva', async () => {
    const state = stateWithStruggled({
      sql: [sqlIds[0]],
      'sql/osnove-upita': [sqlIds[0]],
    });
    await expect(collectStruggledQuestions(state)).resolves.toHaveLength(1);
  });

  it('tiho preskače id-jeve kojih više nema u banci pitanja', async () => {
    const state = stateWithStruggled({ sql: ['ne-postoji-vise', sqlIds[0]] });
    const found = (await collectStruggledQuestions(state)).map((q) => q.id);
    expect(found).toEqual([sqlIds[0]]);
  });

  it('dovlači SAMO teme u kojima greške žive', async () => {
    // Zašto ovo: sesija ponavljanja pet SQL grešaka ne smije skinuti svih 11
    // tema. Popis id-jeva zna temu iz indeksa, prije ijednog dohvata.
    const state = stateWithStruggled({ sql: [sqlIds[0], sqlIds[1]] });
    const found = await collectStruggledQuestions(state);
    expect(found.every((q) => q.topic === 'sql')).toBe(true);
  });
});

describe('countStruggledQuestions', () => {
  it('broji isto što collect vraća, ali bez dohvaćanja pitanja', async () => {
    const state = stateWithStruggled({
      sql: [sqlIds[0], sqlIds[1]],
      frontend: [frontendIds[0]],
    });
    // Sinkrono - ovaj broj stoji u zaglavlju na svakoj stranici.
    expect(countStruggledQuestions(state)).toBe(3);
    expect(countStruggledQuestions(state)).toBe((await collectStruggledQuestions(state)).length);
  });

  it('ne broji id-jeve kojih više nema u banci', () => {
    const state = stateWithStruggled({ sql: ['obrisano-pitanje', sqlIds[0]] });
    expect(countStruggledQuestions(state)).toBe(1);
    expect([...collectStruggledQuestionIds(state)]).toEqual([sqlIds[0]]);
  });
});
