import {
  MAX_HEARTS,
  createDefaultProgressState,
  type ConceptMastery,
  type ConceptMasteryV3,
  type ProgressState,
  type ProgressStateV1,
  type ProgressStateV2,
  type ProgressStateV3,
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
        ? migrateV3ToV4(migrateV2ToV3(migrateV1ToV2(raw as unknown as ProgressStateV1)))
        : createDefaultProgressState();
    case 2:
      return isValidV2(raw)
        ? migrateV3ToV4(migrateV2ToV3(raw as unknown as ProgressStateV2))
        : createDefaultProgressState();
    case 3:
      return isValidV3(raw)
        ? migrateV3ToV4(raw as unknown as ProgressStateV3)
        : createDefaultProgressState();
    case 4:
      return isValidV4(raw) ? (raw as unknown as ProgressState) : createDefaultProgressState();
    default:
      return createDefaultProgressState();
  }
}

/**
 * V3 -> V4: razmaci se prestaju mjeriti u DANIMA i počinju se mjeriti u
 * LEKCIJAMA (vidi lib/scheduling.ts za razlog).
 *
 * `box` se čuva - stečeno znanje se ne poništava. `lessonCounter` se
 * rekonstruira iz stvarne povijesti (zbroj odigranih lekcija), a svi koncepti
 * dobivaju `lastSeenLesson: 0`, čime dospijevaju redom po tome koliko su
 * slabo naučeni: box 0 najprije, box 5 tek ako je igrač odigrao dovoljno
 * lekcija. Nijedan koncept se ne gubi.
 */
function migrateV3ToV4(v3: ProgressStateV3): ProgressState {
  // Barem 1, da koncepti iz box-a 0 (razmak = 1 lekcija) odmah dospiju.
  const lessonCounter = Math.max(
    1,
    Object.values(v3.lessons).reduce(
      (sum, lesson) => sum + (lesson.passCount ?? 0) + (lesson.failCount ?? 0),
      0,
    ),
  );

  const mastery: Record<string, ConceptMastery> = {};
  for (const [conceptId, old] of Object.entries(v3.mastery ?? {})) {
    const box = typeof (old as ConceptMasteryV3)?.box === 'number' ? (old as ConceptMasteryV3).box : 0;
    mastery[conceptId] = { box, lastSeenLesson: 0 };
  }

  const { mastery: _discardedOldShape, ...rest } = v3;
  return { ...rest, version: 4, mastery, lessonCounter };
}

/**
 * V2 -> V3: uvodi razmakom vođeno ponavljanje (mastery po conceptId-u).
 * Postojeće greške (`struggledQuestionIds`) sjedaju u box 0 s jučerašnjim
 * datumom, pa odmah dospijevaju za ponavljanje - ništa se ne gubi.
 */
function migrateV2ToV3(v2: ProgressStateV2): ProgressStateV3 {
  const mastery: Record<string, ConceptMasteryV3> = {};
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

function isValidV4(raw: Record<string, unknown>): boolean {
  return isValidV3(raw) && typeof raw.lessonCounter === 'number';
}
