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
}

export const TOPICS: TopicDefinition[] = [
  { id: 'sql', labelHr: 'SQL', questions: sqlQuestions as Question[] },
  { id: 'frontend', labelHr: 'Frontend', questions: frontendQuestions as Question[] },
  { id: 'backend', labelHr: 'Backend', questions: backendQuestions as Question[] },
  { id: 'general', labelHr: 'Opće', questions: generalQuestions as Question[] },
  { id: 'devops', labelHr: 'DevOps', questions: devopsQuestions as Question[] },
  { id: 'mreze', labelHr: 'Mreže', questions: mrezeQuestions as Question[] },
  { id: 'sigurnost', labelHr: 'Sigurnost', questions: sigurnostQuestions as Question[] },
  { id: 'cudni-kutovi', labelHr: 'Čudni kutovi', questions: cudniKutoviQuestions as Question[] },
  { id: 'jezici', labelHr: 'Jezici', questions: jeziciQuestions as Question[] },
  { id: 'arhitektura', labelHr: 'Arhitektura', questions: arhitekturaQuestions as Question[] },
  { id: 'praksa', labelHr: 'Praksa', questions: praksaQuestions as Question[] },
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
