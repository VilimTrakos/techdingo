import { describe, expect, it } from 'vitest';
import questionIndex from 'virtual:question-index';
import { TOPICS, findTopicOfQuestion, getUnitQuestionCounts, questionExists } from './topics';

/**
 * Indeks je izveden iz istih JSON datoteka kao i pitanja, ali drugim putem
 * (Vite plugin umjesto importa). Ovi testovi drže ta dva puta u skladu.
 */
describe('indeks pitanja', () => {
  it('broj pitanja iz indeksa odgovara stvarnoj temi', () => {
    for (const topic of TOPICS) {
      expect(topic.questionCount, topic.id).toBe(topic.questions.length);
    }
  });

  it('brojevi po cjelini zbrajaju se u ukupan broj teme', () => {
    for (const topic of TOPICS) {
      const perUnit = [...getUnitQuestionCounts(topic.id).values()];
      expect(perUnit.reduce((a, b) => a + b, 0), topic.id).toBe(topic.questionCount);
    }
  });

  it('svako pitanje se preko id-a nađe u svojoj temi', () => {
    for (const topic of TOPICS) {
      for (const question of topic.questions) {
        expect(findTopicOfQuestion(question.id), question.id).toBe(topic.id);
      }
    }
  });

  it('id koji ne postoji ne javlja lažni pogodak', () => {
    expect(questionExists('ovo-pitanje-ne-postoji')).toBe(false);
    expect(findTopicOfQuestion('ovo-pitanje-ne-postoji')).toBeUndefined();
  });

  it('indeks pokriva točno one teme koje su registrirane', () => {
    expect(Object.keys(questionIndex).sort()).toEqual(TOPICS.map((t) => t.id).sort());
  });
});
