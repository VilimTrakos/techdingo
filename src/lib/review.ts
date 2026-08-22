import { TOPICS } from '../data/topics';
import type { ProgressState } from '../state/progressTypes';
import type { Question } from '../types/question';

/** Najviše pitanja u jednoj sesiji ponavljanja. */
export const MAX_REVIEW_SESSION_SIZE = 15;

/**
 * Skuplja SVA pitanja koja je igrač krivo odgovorio, kroz sve teme i cjeline.
 * `struggledQuestionIds` se vodi po lekcijskom ključu (tema ili tema/cjelina),
 * pa isti id može biti u više ključeva - zato dedupliciramo.
 *
 * Id-jeve koji više ne postoje u banci (obrisano/preimenovano pitanje) tiho
 * preskačemo - stanje u localStorageu je starije od koda i to je normalno.
 */
export function collectStruggledQuestions(state: ProgressState): Question[] {
  const struggledIds = new Set<string>();
  for (const lesson of Object.values(state.lessons)) {
    for (const id of lesson.struggledQuestionIds) struggledIds.add(id);
  }
  if (struggledIds.size === 0) return [];

  const found: Question[] = [];
  for (const topic of TOPICS) {
    for (const question of topic.questions) {
      if (struggledIds.has(question.id)) found.push(question);
    }
  }
  return found;
}

/** Koliko pitanja čeka na ponavljanje (za prikaz na početnoj). */
export function countStruggledQuestions(state: ProgressState): number {
  return collectStruggledQuestions(state).length;
}
