import { useCallback, useSyncExternalStore } from 'react';
import { loadProgress, saveProgress } from '../state/storage';
import {
  recordLessonResult as recordLessonResultPure,
  recordScoreStrikeResult as recordScoreStrikeResultPure,
  type LessonResultInput,
  type ScoreStrikeResultInput,
} from '../state/progress';
import type { ProgressStateV1 } from '../state/progressTypes';

/**
 * Modul-level singleton store (ne React Context) - useSyncExternalStore
 * osigurava da se SVE komponente koje pozovu useProgress() re-renderiraju
 * kad bilo koja od njih zapiše promjenu, bez potrebe za Providerom u stablu.
 */
let state: ProgressStateV1 = loadProgress();
const listeners = new Set<() => void>();

function setState(next: ProgressStateV1): void {
  state = next;
  saveProgress(state);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ProgressStateV1 {
  return state;
}

export function useProgress() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  const recordLessonResult = useCallback((topicId: string, input: LessonResultInput) => {
    setState(recordLessonResultPure(state, topicId, input));
  }, []);

  const recordScoreStrikeResult = useCallback(
    (topicIdOrMixed: string, input: ScoreStrikeResultInput): { isNewBest: boolean } => {
      const { state: next, isNewBest } = recordScoreStrikeResultPure(state, topicIdOrMixed, input);
      setState(next);
      return { isNewBest };
    },
    [],
  );

  return { state: snapshot, recordLessonResult, recordScoreStrikeResult };
}
