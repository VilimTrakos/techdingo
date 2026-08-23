import questionIndex from 'virtual:question-index';
import type { Question } from '../types/question';
import sqlQuestions from './questions/sql.json';
import frontendQuestions from './questions/frontend.json';
import backendQuestions from './questions/backend.json';
import generalQuestions from './questions/general.json';
import devopsQuestions from './questions/devops.json';
import mrezeQuestions from './questions/mreze.json';
import sigurnostQuestions from './questions/sigurnost.json';
import cudniKutoviQuestions from './questions/cudni-kutovi.json';
import jeziciQuestions from './questions/jezici.json';
import arhitekturaQuestions from './questions/arhitektura.json';
import praksaQuestions from './questions/praksa.json';

export interface TopicDefinition {
  id: string;
  labelHr: string;
  questions: Question[];
  /** Broj pitanja iz indeksa - dostupan bez čitanja teksta pitanja. */
  questionCount: number;
}

export const TOPICS: TopicDefinition[] = [
  { id: 'sql', labelHr: 'SQL', questions: sqlQuestions as Question[], questionCount: (questionIndex['sql'] ?? []).length },
  { id: 'frontend', labelHr: 'Frontend', questions: frontendQuestions as Question[], questionCount: (questionIndex['frontend'] ?? []).length },
  { id: 'backend', labelHr: 'Backend', questions: backendQuestions as Question[], questionCount: (questionIndex['backend'] ?? []).length },
  { id: 'general', labelHr: 'Opće', questions: generalQuestions as Question[], questionCount: (questionIndex['general'] ?? []).length },
  { id: 'devops', labelHr: 'DevOps', questions: devopsQuestions as Question[], questionCount: (questionIndex['devops'] ?? []).length },
  { id: 'mreze', labelHr: 'Mreže', questions: mrezeQuestions as Question[], questionCount: (questionIndex['mreze'] ?? []).length },
  { id: 'sigurnost', labelHr: 'Sigurnost', questions: sigurnostQuestions as Question[], questionCount: (questionIndex['sigurnost'] ?? []).length },
  { id: 'cudni-kutovi', labelHr: 'Čudni kutovi', questions: cudniKutoviQuestions as Question[], questionCount: (questionIndex['cudni-kutovi'] ?? []).length },
  { id: 'jezici', labelHr: 'Jezici', questions: jeziciQuestions as Question[], questionCount: (questionIndex['jezici'] ?? []).length },
  { id: 'arhitektura', labelHr: 'Arhitektura', questions: arhitekturaQuestions as Question[], questionCount: (questionIndex['arhitektura'] ?? []).length },
  { id: 'praksa', labelHr: 'Praksa', questions: praksaQuestions as Question[], questionCount: (questionIndex['praksa'] ?? []).length },
];

export function getTopic(topicId: string): TopicDefinition | undefined {
  return TOPICS.find((t) => t.id === topicId);
}

/** `topicIdOrMixed === 'mixed'` vraća pitanja iz svih tema kombinirano. */
export function getQuestionsForScoreStrike(topicIdOrMixed: string): Question[] {
  if (topicIdOrMixed === 'mixed') {
    return TOPICS.flatMap((t) => t.questions);
  }
  return getTopic(topicIdOrMixed)?.questions ?? [];
}

/** Koliko pitanja ima svaka cjelina teme - za prikaz na putu učenja. */
export function getUnitQuestionCounts(topicId: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const [, unitId] of questionIndex[topicId] ?? []) {
    counts.set(unitId, (counts.get(unitId) ?? 0) + 1);
  }
  return counts;
}

/**
 * id pitanja -> tema. Gradi se jednom, lijeno: bez mape bi svaki prikaz broja
 * pitanja za ponavljanje linearno pretraživao svih 11 tema po id-u.
 */
let topicByQuestionId: Map<string, string> | null = null;

function questionTopicMap(): Map<string, string> {
  if (topicByQuestionId) return topicByQuestionId;
  const map = new Map<string, string>();
  for (const [topicId, entries] of Object.entries(questionIndex)) {
    for (const [id] of entries) map.set(id, topicId);
  }
  topicByQuestionId = map;
  return map;
}

/**
 * Tema u kojoj pitanje živi, ili `undefined` ako id više ne postoji u banci.
 * Koristi se da se za ponavljanje dovuku SAMO teme koje stvarno trebaju.
 */
export function findTopicOfQuestion(questionId: string): string | undefined {
  return questionTopicMap().get(questionId);
}

/**
 * Postoji li pitanje s tim id-em još uvijek u banci? Stanje u localStorageu
 * je starije od koda, pa obrisana i preimenovana pitanja treba tiho ispustiti.
 */
export function questionExists(questionId: string): boolean {
  return questionTopicMap().has(questionId);
}
