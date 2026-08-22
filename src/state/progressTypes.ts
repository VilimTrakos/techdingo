export interface TopicLessonProgress {
  passCount: number;
  failCount: number;
  /** Id-jevi pitanja iz POSLJEDNJE dovršene lekcije za ovaj ključ (zamjenjuje se, ne akumulira). */
  recentQuestionIds: string[];
  /** Pitanja krivo odgovorena u nedavnim lekcijama - prioritetno se vraćaju u iduće sesije (lagano ponavljanje radi pamćenja). */
  struggledQuestionIds: string[];
}

export interface TopicScoreStrikeProgress {
  bestScore: number;
  bestAtISO: string;
  playCount: number;
  recentQuestionIds: string[];
}

export interface HeartsState {
  /** Materijalizirana zaliha - stvarna trenutna vrijednost se računa lijeno preko resolveHearts() (vidi hearts.ts). */
  balance: number;
  /** UTC timestamp od kojeg se regeneracija akumulira; null = zaliha puna. */
  lastRegenAtISO: string | null;
}

export interface DailyChallengeState {
  /** Lokalni datum (YYYY-MM-DD) zadnjeg odigranog dnevnog izazova - jednom dnevno. */
  lastPlayedDateISO: string | null;
  lastScore: number;
  bestScore: number;
}

export interface ProgressStateV1 {
  version: 1;
  xpTotal: number;
  streak: {
    current: number;
    longest: number;
    /** Lokalni datum (YYYY-MM-DD), ne UTC. */
    lastCompletedDateISO: string | null;
  };
  lessons: Record<string, Omit<TopicLessonProgress, 'struggledQuestionIds'>>;
  scoreStrike: Record<string, TopicScoreStrikeProgress>;
  updatedAtISO: string;
}

export interface ProgressStateV2 {
  version: 2;
  xpTotal: number;
  streak: {
    current: number;
    longest: number;
    /** Lokalni datum (YYYY-MM-DD), ne UTC. */
    lastCompletedDateISO: string | null;
  };
  /**
   * Ključ je `topicId` (naslijeđene lekcije cijele teme) ili
   * `topicId/unitId` (lekcije pojedine cjeline, vidi units.ts).
   */
  lessons: Record<string, TopicLessonProgress>;
  scoreStrike: Record<string, TopicScoreStrikeProgress>;
  /** Trajna srca - dijele se kroz sve lekcije, NE sinkroniziraju se u cloud (lokalno po uređaju). */
  hearts: HeartsState;
  /** Dnevni izazov - NE sinkronizira se u cloud (lokalno po uređaju). */
  dailyChallenge: DailyChallengeState;
  updatedAtISO: string;
}

/** Aktualna verzija - novi kod uvijek radi s ovim aliasom, ne s konkretnim VN tipom. */
export type ProgressState = ProgressStateV2;

export const MAX_HEARTS = 5;

export function createDefaultProgressState(): ProgressState {
  return {
    version: 2,
    xpTotal: 0,
    streak: { current: 0, longest: 0, lastCompletedDateISO: null },
    lessons: {},
    scoreStrike: {},
    hearts: { balance: MAX_HEARTS, lastRegenAtISO: null },
    dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
    updatedAtISO: new Date().toISOString(),
  };
}
