import { questionExists } from '../data/topics';
import { loadQuestionsByIds } from '../data/questionLoader';
import type { ProgressState } from '../state/progressTypes';
import type { Question } from '../types/question';

/** Najviše pitanja u jednoj sesiji ponavljanja. */
export const MAX_REVIEW_SESSION_SIZE = 15;

/**
 * Id-jevi svih pitanja koja je igrač krivo odgovorio, kroz sve teme i cjeline.
 * `struggledQuestionIds` se vodi po lekcijskom ključu (tema ili tema/cjelina),
 * pa isti id može biti u više ključeva - zato dedupliciramo.
 *
 * Id-jeve koji više ne postoje u banci (obrisano/preimenovano pitanje) tiho
 * preskačemo - stanje u localStorageu je starije od koda i to je normalno.
 */
export function collectStruggledQuestionIds(state: ProgressState): Set<string> {
  const struggledIds = new Set<string>();
  for (const lesson of Object.values(state.lessons)) {
    for (const id of lesson.struggledQuestionIds) {
      if (questionExists(id)) struggledIds.add(id);
    }
  }
  return struggledIds;
}

/**
 * Puna pitanja za sesiju ponavljanja. Dovlači samo teme u kojima greške žive,
 * pa ponavljanje pet SQL pitanja ne skida cijelu banku.
 */
export function collectStruggledQuestions(state: ProgressState): Promise<Question[]> {
  return loadQuestionsByIds(collectStruggledQuestionIds(state));
}

/**
 * Koliko pitanja čeka na ponavljanje. Namjerno sinkrono i bez teksta pitanja:
 * ovaj broj stoji u zaglavlju na SVAKOJ stranici, pa ne smije ovisiti o tome
 * je li ijedna tema dovučena.
 */
export function countStruggledQuestions(state: ProgressState): number {
  return collectStruggledQuestionIds(state).size;
}
