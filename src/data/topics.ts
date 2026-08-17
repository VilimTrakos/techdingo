import type { Question } from '../types/question';
import sqlQuestions from './questions/sql.json';
import frontendQuestions from './questions/frontend.json';
import backendQuestions from './questions/backend.json';

export interface TopicDefinition {
  id: string;
  labelHr: string;
  questions: Question[];
}

export const TOPICS: TopicDefinition[] = [
  { id: 'sql', labelHr: 'SQL', questions: sqlQuestions as Question[] },
  { id: 'frontend', labelHr: 'Frontend', questions: frontendQuestions as Question[] },
  { id: 'backend', labelHr: 'Backend', questions: backendQuestions as Question[] },
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
