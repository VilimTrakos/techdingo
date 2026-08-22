import {
  MAX_HEARTS,
  createDefaultProgressState,
  type ProgressState,
  type ProgressStateV1,
  type TopicLessonProgress,
} from './progressTypes';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Pretvara nepoznati/možda pokvareni podatak iz localStorage u važeći ProgressState.
 * Nepoznata/nevažeća verzija ili pokvaren oblik -> svjež default (gubitak podataka je
 * prihvatljiv, pad aplikacije nije). NAPOMENA: STORAGE_KEY u storage.ts ostaje
 * "techdingo:progress:v1" - verziju vodi `version` polje U payloadu, ne ključ
 * (promjena ključa bi zaobišla migraciju i izgubila podatke postojećih korisnika).
 */
export function migrate(raw: unknown): ProgressState {
  if (!isPlainObject(raw)) {
    return createDefaultProgressState();
  }

  switch (raw.version) {
    case 1:
      return isValidV1(raw)
        ? migrateV1ToV2(raw as unknown as ProgressStateV1)
        : createDefaultProgressState();
    case 2:
      return isValidV2(raw) ? (raw as unknown as ProgressState) : createDefaultProgressState();
    default:
      return createDefaultProgressState();
  }
}

function migrateV1ToV2(v1: ProgressStateV1): ProgressState {
  const lessons: Record<string, TopicLessonProgress> = {};
  for (const [key, lesson] of Object.entries(v1.lessons)) {
    lessons[key] = { ...lesson, struggledQuestionIds: [] };
  }
  return {
    version: 2,
    xpTotal: v1.xpTotal,
    streak: v1.streak,
    lessons,
    scoreStrike: v1.scoreStrike,
    hearts: { balance: MAX_HEARTS, lastRegenAtISO: null },
    dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
    updatedAtISO: v1.updatedAtISO,
  };
}

function isValidV1(raw: Record<string, unknown>): boolean {
  return (
    typeof raw.xpTotal === 'number' &&
    isPlainObject(raw.streak) &&
    typeof raw.streak.current === 'number' &&
    typeof raw.streak.longest === 'number' &&
    isPlainObject(raw.lessons) &&
    isPlainObject(raw.scoreStrike)
  );
}

function isValidV2(raw: Record<string, unknown>): boolean {
  return (
    isValidV1(raw) &&
    isPlainObject(raw.hearts) &&
    typeof raw.hearts.balance === 'number' &&
    isPlainObject(raw.dailyChallenge)
  );
}
