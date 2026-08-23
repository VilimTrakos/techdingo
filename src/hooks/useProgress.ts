import { useCallback, useSyncExternalStore } from 'react';
import { loadProgress, saveProgress } from '../state/storage';
import {
  grantHeartsOnState,
  recordDailyChallengeResult as recordDailyChallengeResultPure,
  recordLessonResult as recordLessonResultPure,
  recordReviewResult as recordReviewResultPure,
  recordScoreStrikeResult as recordScoreStrikeResultPure,
  resolveHeartsOnState,
  spendHeartOnState,
  type DailyChallengeResultInput,
  type LessonResultInput,
  type ReviewResultInput,
  type ScoreStrikeResultInput,
} from '../state/progress';
import { MAX_HEARTS, createDefaultProgressState } from '../state/progressTypes';
import type { ProgressState } from '../state/progressTypes';
import { getCurrentUserId, registerOnLogin, registerOnLogout } from '../state/authUserRef';
import { mergeAndSyncOnLogin, pushCloudProgress } from '../state/cloudSync';

/**
 * Modul-level singleton store (ne React Context) - useSyncExternalStore
 * osigurava da se SVE komponente koje pozovu useProgress() re-renderiraju
 * kad bilo koja od njih zapiše promjenu, bez potrebe za Providerom u stablu.
 */
let state: ProgressState = loadProgress();
const listeners = new Set<() => void>();

function setState(next: ProgressState, options: { skipCloudPush?: boolean } = {}): void {
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

// Odjava briše napredak iz memorije i localStoragea - bez ovoga bi se na
// dijeljenom uređaju napredak prethodnog korisnika spojio u cloud red
// sljedećeg (vidi authUserRef.ts). Napredak nije izgubljen: prijavljeni
// korisnik ga ima u cloudu i vrati ga merge pri sljedećoj prijavi.
registerOnLogout(() => {
  const fresh = createDefaultProgressState();
  // Srca su vezana uz UREĐAJ, ne uz račun (namjerno se ne sinkroniziraju),
  // pa ih odjava ne smije resetirati - inače bi odjava bila besplatan refill.
  setState({ ...fresh, hearts: state.hearts }, { skipCloudPush: true });
});

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ProgressState {
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

  const recordDailyChallengeResult = useCallback((input: DailyChallengeResultInput) => {
    setState(recordDailyChallengeResultPure(state, input));
  }, []);

  const recordReviewResult = useCallback((input: ReviewResultInput) => {
    setState(recordReviewResultPure(state, input));
  }, []);

  // Srca se ne sinkroniziraju u cloud (lokalno po uređaju) - skipCloudPush
  // izbjegava besmislen mrežni upsert na svako potrošeno/regenerirano srce.
  const spendHeart = useCallback(() => {
    setState(spendHeartOnState(state), { skipCloudPush: true });
  }, []);

  /** Nagrada za (stub) reklamu: +1 srce. */
  const grantAdHeart = useCallback(() => {
    setState(grantHeartsOnState(state, 1), { skipCloudPush: true });
  }, []);

  /** Puni refill. SAMO za razvojni build (import.meta.env.DEV) - vidi AppShell/HeartsGate. */
  const refillHearts = useCallback(() => {
    setState(grantHeartsOnState(state, MAX_HEARTS), { skipCloudPush: true });
  }, []);

  /** Materijalizira lijenu regeneraciju (poziva se pri ulasku na ekrane sa srcima). */
  const syncHearts = useCallback(() => {
    const next = resolveHeartsOnState(state);
    if (next !== state) setState(next, { skipCloudPush: true });
  }, []);

  return {
    state: snapshot,
    recordLessonResult,
    recordScoreStrikeResult,
    recordDailyChallengeResult,
    recordReviewResult,
    spendHeart,
    grantAdHeart,
    refillHearts,
    syncHearts,
  };
}
