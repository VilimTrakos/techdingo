export interface TopicLessonProgress {
  passCount: number;
  failCount: number;
  /** Id-jevi pitanja iz POSLJEDNJE dovršene lekcije za ovu temu (zamjenjuje se, ne akumulira). */
  recentQuestionIds: string[];
}

export interface TopicScoreStrikeProgress {
  bestScore: number;
  bestAtISO: string;
  playCount: number;
  recentQuestionIds: string[];
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
  lessons: Record<string, TopicLessonProgress>;
  scoreStrike: Record<string, TopicScoreStrikeProgress>;
  updatedAtISO: string;
}

export function createDefaultProgressState(): ProgressStateV1 {
  return {
    version: 1,
    xpTotal: 0,
    streak: { current: 0, longest: 0, lastCompletedDateISO: null },
    lessons: {},
    scoreStrike: {},
    updatedAtISO: new Date().toISOString(),
  };
}
