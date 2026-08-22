import { describe, expect, it } from 'vitest';
import { selectDailyQuestions } from './daily';
import type { Question } from '../types/question';

function makeQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t-${String(i).padStart(3, '0')}`,
    topic: 't',
    unitId: 'u',
    question: `P${i}?`,
    options: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    correctIndex: 0 as const,
    difficulty: 'easy' as const,
  }));
}

describe('selectDailyQuestions', () => {
  it('isti datum + ista banka = identičan skup i redoslijed (deterministički)', () => {
    const bank = makeQuestions(50);
    const a = selectDailyQuestions('2026-08-22', bank);
    const b = selectDailyQuestions('2026-08-22', [...bank].reverse());
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it('različiti datumi daju različit skup (za razumnu banku)', () => {
    const bank = makeQuestions(100);
    const a = selectDailyQuestions('2026-08-22', bank).map((q) => q.id);
    const b = selectDailyQuestions('2026-08-23', bank).map((q) => q.id);
    expect(a).not.toEqual(b);
  });

  it('vraća traženu veličinu bez duplikata', () => {
    const picked = selectDailyQuestions('2026-08-22', makeQuestions(40), 10);
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((q) => q.id)).size).toBe(10);
  });

  it('manja banka od size ne baca - vraća sve', () => {
    expect(selectDailyQuestions('2026-08-22', makeQuestions(4), 10)).toHaveLength(4);
  });
});
