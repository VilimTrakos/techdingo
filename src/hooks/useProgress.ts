import { useCallback, useSyncExternalStore } from 'react';
import { loadProgress, saveProgress } from '../state/storage';
import {
  recordLessonResult as recordLessonResultPure,
  recordScoreStrikeResult as recordScoreStrikeResultPure,
  type LessonResultInput,
  type ScoreStrikeResultInput,
} from '../state/progress';
import type { ProgressStateV1 } from '../state/progressTypes';
import { getCurrentUserId, registerOnLogin } from '../state/authUserRef';
import { mergeAndSyncOnLogin, pushCloudProgress } from '../state/cloudSync';

/**
 * Modul-level singleton store (ne React Context) - useSyncExternalStore
 * osigurava da se SVE komponente koje pozovu useProgress() re-renderiraju
 * kad bilo koja od njih zapiše promjenu, bez potrebe za Providerom u stablu.
 */
let state: ProgressStateV1 = loadProgress();
const listeners = new Set<() => void>();

function setState(next: ProgressStateV1, options: { skipCloudPush?: boolean } = {}): void {
  state = next;
  saveProgress(state);
  for (const listener of listeners) listener();

  // Best-effort, fire-and-forget - lokalni update je odmah (brz UX), cloud
  // sync ne blokira i nema retry queue (dovoljno za praksu-app napredak).
  const userId = getCurrentUserId();
  if (userId && !options.skipCloudPush) {
    pushCloudProgress(userId, state).catch((err) => {
      console.warn('techdingo: sinkronizacija napretka u cloud nije uspjela.', err);
    });
  }
}

// Registrira se jednom pri učitavanju modula (vidi authUserRef.ts - neutralni
// koordinacijski modul da se izbjegne cirkularni import s useAuth.ts).
registerOnLogin((userId) => {
  mergeAndSyncOnLogin(userId, state)
    .then((merged) => setState(merged, { skipCloudPush: true }))
    .catch((err) => {
      console.warn('techdingo: spajanje napretka pri loginu nije uspjelo.', err);
    });
});

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
