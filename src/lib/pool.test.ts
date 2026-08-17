import { describe, expect, it } from 'vitest';
import { MAX_SESSION_SIZE, MIN_SESSION_SIZE, randomSessionSize, selectSessionPool, shuffleOptions } from './pool';
import type { Question } from '../types/question';

function makeQuestions(count: number, topic = 'test'): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${topic}-${i}`,
    topic,
    question: `Pitanje ${i}?`,
    options: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    correctIndex: (i % 4) as 0 | 1 | 2 | 3,
  }));
}

describe('randomSessionSize', () => {
  it('vraća uvijek broj u rasponu [15, 17]', () => {
    for (let i = 0; i < 200; i++) {
      const size = randomSessionSize();
      expect(size).toBeGreaterThanOrEqual(MIN_SESSION_SIZE);
      expect(size).toBeLessThanOrEqual(MAX_SESSION_SIZE);
    }
  });
});

describe('selectSessionPool', () => {
  it('vraća traženu veličinu kad banka ima dovoljno pitanja', () => {
    const all = makeQuestions(25);
    const selected = selectSessionPool(all, [], 17);
    expect(selected).toHaveLength(17);
    const ids = new Set(selected.map((q) => q.id));
    expect(ids.size).toBe(17);
  });

  it('izbjegava recentIds kad god je to moguće', () => {
    const all = makeQuestions(25);
    const recentIds = all.slice(0, 10).map((q) => q.id);
    const selected = selectSessionPool(all, recentIds, 15);
    const overlap = selected.filter((q) => recentIds.includes(q.id));
    expect(overlap).toHaveLength(0);
  });

  it('popuni iz recentIds kad banka nema dovoljno svježih pitanja', () => {
    const all = makeQuestions(16);
    const recentIds = all.slice(0, 10).map((q) => q.id);
    const selected = selectSessionPool(all, recentIds, 15);
    expect(selected).toHaveLength(15);
    const ids = new Set(selected.map((q) => q.id));
    expect(ids.size).toBe(15);
  });

  it('nikad ne baca i vraća najviše onoliko koliko banka ima', () => {
    const all = makeQuestions(5);
    const selected = selectSessionPool(all, [], 17);
    expect(selected.length).toBe(5);
  });
});

describe('shuffleOptions', () => {
  it('sadrži identičan skup opcija i ispravno prati correctIndex', () => {
    const question = makeQuestions(1)[0];
    for (let i = 0; i < 20; i++) {
      const { options, correctIndex } = shuffleOptions(question);
      expect(new Set(options)).toEqual(new Set(question.options));
      expect(options[correctIndex]).toBe(question.options[question.correctIndex]);
    }
  });
});
