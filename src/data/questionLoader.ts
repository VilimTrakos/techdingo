import type { Question } from '../types/question';
import { TOPICS, findTopicOfQuestion } from './topics';

/**
 * Pun tekst pitanja dolazi u zasebnom chunku po temi, tek kad zatreba.
 * Vite od svakog `import()` ovdje radi vlastitu datoteku - zato su ispisani
 * doslovno, a ne kroz varijablu u putanji (to bundler ne može statički vidjeti).
 */
const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  sql: () => import('./questions/sql.json'),
  frontend: () => import('./questions/frontend.json'),
  backend: () => import('./questions/backend.json'),
  general: () => import('./questions/general.json'),
  devops: () => import('./questions/devops.json'),
  mreze: () => import('./questions/mreze.json'),
  sigurnost: () => import('./questions/sigurnost.json'),
  'cudni-kutovi': () => import('./questions/cudni-kutovi.json'),
  jezici: () => import('./questions/jezici.json'),
  arhitektura: () => import('./questions/arhitektura.json'),
  praksa: () => import('./questions/praksa.json'),
};

// Jednom dovučena tema ostaje u memoriji: igrač koji ponovi lekciju ili se
// vrati na istu temu ne čeka ponovno.
const cache = new Map<string, Question[]>();
const inFlight = new Map<string, Promise<Question[]>>();

export async function loadTopicQuestions(topicId: string): Promise<Question[]> {
  const cached = cache.get(topicId);
  if (cached) return cached;

  const pending = inFlight.get(topicId);
  if (pending) return pending;

  const loader = LOADERS[topicId];
  if (!loader) return [];

  const promise = loader()
    .then((module) => {
      const questions = module.default as Question[];
      cache.set(topicId, questions);
      inFlight.delete(topicId);
      return questions;
    })
    .catch((err) => {
      // Chunk može pasti (mreža, stari deploy s obrisanim datotekama). Bez
      // brisanja iz inFlight ostao bi zauvijek odbijeni promise u cacheu.
      inFlight.delete(topicId);
      throw err;
    });

  inFlight.set(topicId, promise);
  return promise;
}

/** `topicIdOrMixed === 'mixed'` dovlači sve teme i spaja ih. */
export async function loadQuestionsForScoreStrike(topicIdOrMixed: string): Promise<Question[]> {
  if (topicIdOrMixed !== 'mixed') return loadTopicQuestions(topicIdOrMixed);
  const perTopic = await Promise.all(TOPICS.map((topic) => loadTopicQuestions(topic.id)));
  return perTopic.flat();
}

/**
 * Dovlači samo teme u kojima ti id-jevi žive - ponavljanje pet SQL grešaka ne
 * treba skinuti svih 11 tema. Id-jevi kojih više nema u banci se preskaču.
 */
export async function loadQuestionsByIds(ids: Iterable<string>): Promise<Question[]> {
  const wanted = new Set(ids);
  if (wanted.size === 0) return [];

  const topicIds = new Set<string>();
  for (const id of wanted) {
    const topicId = findTopicOfQuestion(id);
    if (topicId) topicIds.add(topicId);
  }
  if (topicIds.size === 0) return [];

  const perTopic = await Promise.all([...topicIds].map((topicId) => loadTopicQuestions(topicId)));
  return perTopic.flat().filter((question) => wanted.has(question.id));
}
