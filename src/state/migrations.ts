import {
  MAX_HEARTS,
  createDefaultProgressState,
  type ConceptMastery,
  type ProgressState,
  type ProgressStateV1,
  type ProgressStateV2,
  type TopicLessonProgress,
} from './progressTypes';

import { toLocalDateISO } from './streak';

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
        ? migrateV2ToV3(migrateV1ToV2(raw as unknown as ProgressStateV1))
        : createDefaultProgressState();
    case 2:
      return isValidV2(raw)
        ? migrateV2ToV3(raw as unknown as ProgressStateV2)
        : createDefaultProgressState();
    case 3:
      return isValidV3(raw) ? (raw as unknown as ProgressState) : createDefaultProgressState();
    default:
      return createDefaultProgressState();
  }
}

/**
 * V2 -> V3: uvodi razmakom vođeno ponavljanje (mastery po conceptId-u).
 * Postojeće greške (`struggledQuestionIds`) sjedaju u box 0 s jučerašnjim
 * datumom, pa odmah dospijevaju za ponavljanje - ništa se ne gubi.
 */
function migrateV2ToV3(v2: ProgressStateV2): ProgressState {
  const mastery: Record<string, ConceptMastery> = {};
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = toLocalDateISO(yesterday);

  for (const lesson of Object.values(v2.lessons)) {
    for (const questionId of lesson.struggledQuestionIds ?? []) {
      // Ključ je conceptId pitanja, ali migracija nema pristup banci pitanja
      // (čisti state modul). Id je siguran fallback: pitanja bez conceptId-a
      // su sama sebi koncept, a ona s njim samo dobiju jedan ciklus viška.
      mastery[questionId] = { box: 0, lastSeenDateISO: yesterdayISO };
    }
  }

  return { ...v2, version: 3, mastery };
}

function migrateV1ToV2(v1: ProgressStateV1): ProgressStateV2 {
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

function isValidV3(raw: Record<string, unknown>): boolean {
  return isValidV2(raw) && isPlainObject(raw.mastery);
}
