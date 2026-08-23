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

/**
 * Napredak po KONCEPTU (ne po pojedinom pitanju): više pitanja može dijeliti
 * `conceptId` kao varijante iste činjenice, pa se znanje vodi zajedno.
 * Vidi src/lib/scheduling.ts za Leitner razmake.
 */
export interface ConceptMastery {
  /** 0 = promašeno/novo, MAX_BOX = naučeno. Viši box = dulji razmak do ponavljanja. */
  box: number;
  /** Lokalni datum (YYYY-MM-DD) zadnjeg susreta s konceptom. */
  lastSeenDateISO: string;
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

export interface ProgressStateV3 {
  version: 3;
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
  /**
   * Razmakom vođeno ponavljanje po conceptId-u. Ovo je izvor istine za
   * "što treba ponoviti" - `struggledQuestionIds` na lekcijama ostaje samo
   * kao pomoćni popis za brzo skupljanje grešaka po temi.
   */
  mastery: Record<string, ConceptMastery>;
  /** Trajna srca - dijele se kroz sve lekcije, NE sinkroniziraju se u cloud (lokalno po uređaju). */
  hearts: HeartsState;
  /** Dnevni izazov - NE sinkronizira se u cloud (lokalno po uređaju). */
  dailyChallenge: DailyChallengeState;
  updatedAtISO: string;
}

/** Aktualna verzija - novi kod uvijek radi s ovim aliasom, ne s konkretnim VN tipom. */
export type ProgressState = ProgressStateV3;

export const MAX_HEARTS = 5;

export function createDefaultProgressState(): ProgressState {
  return {
    version: 3,
    xpTotal: 0,
    streak: { current: 0, longest: 0, lastCompletedDateISO: null },
    lessons: {},
    scoreStrike: {},
    mastery: {},
    hearts: { balance: MAX_HEARTS, lastRegenAtISO: null },
    dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
    updatedAtISO: new Date().toISOString(),
  };
}
