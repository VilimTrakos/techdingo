import { describe, expect, it } from 'vitest';
import { correctAnswerText, gradeAnswer, prepareQuestion } from './questionKinds';
import type {
  FillBlankQuestion,
  MultiChoiceQuestion,
  OrderStepsQuestion,
  SingleChoiceQuestion,
} from '../types/question';

const base = { topic: 'test', unitId: 'u', difficulty: 'easy' as const };

const single: SingleChoiceQuestion = {
  ...base,
  id: 'test-single',
  question: 'Q?',
  options: ['a', 'b', 'c', 'd'],
  correctIndex: 2,
};

const multi: MultiChoiceQuestion = {
  ...base,
  id: 'test-multi',
  kind: 'multi',
  question: 'Q?',
  options: ['a', 'b', 'c', 'd', 'e'],
  correctIndexes: [0, 2, 4],
};

const fill: FillBlankQuestion = {
  ...base,
  id: 'test-fill',
  kind: 'fill',
  question: 'Dopuni:',
  text: 'SELECT ___ FROM users ___ age > 18',
  answers: ['name', 'WHERE'],
  distractors: ['ORDER', 'GROUP'],
};

const order: OrderStepsQuestion = {
  ...base,
  id: 'test-order',
  kind: 'order',
  question: 'Poredaj:',
  steps: ['FROM', 'WHERE', 'GROUP BY', 'SELECT'],
};

describe('prepareQuestion', () => {
  it('single: točan odgovor preživi miješanje opcija', () => {
    for (let i = 0; i < 20; i++) {
      const p = prepareQuestion(single);
      if (p.kind !== 'single') throw new Error('kriva vrsta');
      expect(p.options[p.correctIndex]).toBe('c');
      expect([...p.options].sort()).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('multi: svi točni indeksi preživljavaju miješanje', () => {
    for (let i = 0; i < 20; i++) {
      const p = prepareQuestion(multi);
      if (p.kind !== 'multi') throw new Error('kriva vrsta');
      const correctTexts = p.correctIndexes.map((idx) => p.options[idx]).sort();
      expect(correctTexts).toEqual(['a', 'c', 'e']);
    }
  });

  it('fill: banka riječi sadrži sve answers + distractors', () => {
    const p = prepareQuestion(fill);
    if (p.kind !== 'fill') throw new Error('kriva vrsta');
    expect([...p.wordBank].sort()).toEqual(['GROUP', 'ORDER', 'WHERE', 'name']);
  });

  it('order: izmiješani koraci nikad nisu već u točnom redoslijedu', () => {
    for (let i = 0; i < 50; i++) {
      const p = prepareQuestion(order);
      if (p.kind !== 'order') throw new Error('kriva vrsta');
      expect(p.shuffledSteps).not.toEqual(order.steps);
      expect([...p.shuffledSteps].sort()).toEqual([...order.steps].sort());
    }
  });
});

describe('gradeAnswer', () => {
  it('single: točan i netočan indeks', () => {
    const p = prepareQuestion(single);
    if (p.kind !== 'single') throw new Error('kriva vrsta');
    expect(gradeAnswer(p, { kind: 'single', optionIndex: p.correctIndex })).toBe(true);
    expect(gradeAnswer(p, { kind: 'single', optionIndex: (p.correctIndex + 1) % 4 })).toBe(false);
  });

  it('multi: traži TOČNO sve točne, redoslijed odabira nebitan', () => {
    const p = prepareQuestion(multi);
    if (p.kind !== 'multi') throw new Error('kriva vrsta');
    const reversed = [...p.correctIndexes].reverse();
    expect(gradeAnswer(p, { kind: 'multi', selectedIndexes: reversed })).toBe(true);
    expect(gradeAnswer(p, { kind: 'multi', selectedIndexes: p.correctIndexes.slice(1) })).toBe(false);
    const wrongIndex = p.options.findIndex((_, i) => !p.correctIndexes.includes(i));
    expect(
      gradeAnswer(p, { kind: 'multi', selectedIndexes: [...p.correctIndexes, wrongIndex] }),
    ).toBe(false);
  });

  it('fill: redoslijed riječi bitan, velika/mala slova nisu', () => {
    const p = prepareQuestion(fill);
    if (p.kind !== 'fill') throw new Error('kriva vrsta');
    expect(gradeAnswer(p, { kind: 'fill', words: ['name', 'where'] })).toBe(true);
    expect(gradeAnswer(p, { kind: 'fill', words: ['WHERE', 'name'] })).toBe(false);
    expect(gradeAnswer(p, { kind: 'fill', words: ['name'] })).toBe(false);
  });

  it('order: samo točan redoslijed prolazi', () => {
    const p = prepareQuestion(order);
    if (p.kind !== 'order') throw new Error('kriva vrsta');
    expect(gradeAnswer(p, { kind: 'order', orderedSteps: order.steps })).toBe(true);
    expect(gradeAnswer(p, { kind: 'order', orderedSteps: p.shuffledSteps })).toBe(false);
  });
});

describe('correctAnswerText', () => {
  it('daje čitljiv tekst za svaku vrstu', () => {
    expect(correctAnswerText(prepareQuestion(single))).toBe('c');
    expect(correctAnswerText(prepareQuestion(fill))).toBe('name, WHERE');
    expect(correctAnswerText(prepareQuestion(order))).toBe(
      '1. FROM → 2. WHERE → 3. GROUP BY → 4. SELECT',
    );
    const multiText = correctAnswerText(prepareQuestion(multi));
    expect(multiText.split(' · ').sort()).toEqual(['a', 'c', 'e']);
  });
});
