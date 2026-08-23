import questionIndex from 'virtual:question-index';

export interface TopicDefinition {
  id: string;
  labelHr: string;
  /** Ukupan broj pitanja u temi - iz indeksa, bez učitavanja teksta pitanja. */
  questionCount: number;
}

/**
 * Redoslijed tema na početnoj i u svim izbornicima - od najpoznatijih prema
 * najužim. Ovo je jedini popis koji određuje koje teme postoje; datoteka u
 * src/data/questions/ bez unosa ovdje neće se nigdje prikazati.
 */
const TOPIC_LABELS: [id: string, labelHr: string][] = [
  ['sql', 'SQL'],
  ['frontend', 'Frontend'],
  ['backend', 'Backend'],
  ['general', 'Opće'],
  ['devops', 'DevOps'],
  ['mreze', 'Mreže'],
  ['sigurnost', 'Sigurnost'],
  ['cudni-kutovi', 'Čudni kutovi'],
  ['jezici', 'Jezici'],
  ['arhitektura', 'Arhitektura'],
  ['praksa', 'Praksa'],
];

export const TOPICS: TopicDefinition[] = TOPIC_LABELS.map(([id, labelHr]) => ({
  id,
  labelHr,
  questionCount: (questionIndex[id] ?? []).length,
}));

export function getTopic(topicId: string): TopicDefinition | undefined {
  return TOPICS.find((t) => t.id === topicId);
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
