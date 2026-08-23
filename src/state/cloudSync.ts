import { supabase } from './supabaseClient';
import { mergeProgress } from './mergeProgress';
import type { ProgressState } from './progressTypes';

interface ProgressRow {
  xp_total: number;
  streak_current: number;
  streak_longest: number;
  streak_last_completed_date: string | null;
  updated_at: string;
}

interface LessonProgressRow {
  topic_id: string;
  pass_count: number;
  fail_count: number;
  recent_question_ids: string[] | null;
  struggled_question_ids: string[] | null;
}

interface ScoreStrikeProgressRow {
  topic_id: string;
  best_score: number;
  best_at: string | null;
  play_count: number;
  recent_question_ids: string[] | null;
}

/**
 * Supabase klijent NE baca na grešku upita - vraća `{ data, error }`. Bez ove
 * provjere neuspjeli upis prolazi kao uspjeh: `pushCloudProgress` se uredno
 * resolva, `.catch` u useProgress se nikad ne okine, i korisnik misli da je
 * napredak spremljen u oblak dok nije.
 *
 * Točno se to i dogodilo: kod je pisao `struggled_question_ids` prije nego je
 * migracija 0003 pokrenuta na bazi, pa cijeli lesson_progress mjesecima nije
 * sinkronizirao, bez ijedne poruke.
 */
function throwIfFailed(what: string, error: { message: string } | null): void {
  if (error) throw new Error(`Supabase: ${what} nije uspjelo - ${error.message}`);
}

/** `null` ako korisnik još nema cloud red (npr. prvi login nakon registracije). */
export async function fetchCloudProgress(userId: string): Promise<ProgressState | null> {
  if (!supabase) return null;

  const [progressResult, lessonResult, scoreStrikeResult] = await Promise.all([
    supabase.from('progress').select('*').eq('user_id', userId).maybeSingle<ProgressRow>(),
    supabase.from('lesson_progress').select('*').eq('user_id', userId).returns<LessonProgressRow[]>(),
    supabase.from('score_strike_progress').select('*').eq('user_id', userId).returns<ScoreStrikeProgressRow[]>(),
  ]);

  throwIfFailed('čitanje progress reda', progressResult.error);
  throwIfFailed('čitanje lesson_progress redova', lessonResult.error);
  throwIfFailed('čitanje score_strike_progress redova', scoreStrikeResult.error);

  const progressRow = progressResult.data;
  const lessonRows = lessonResult.data;
  const scoreStrikeRows = scoreStrikeResult.data;

  if (!progressRow) return null;

  const lessons: ProgressState['lessons'] = {};
  for (const row of lessonRows ?? []) {
    lessons[row.topic_id] = {
      passCount: row.pass_count,
      failCount: row.fail_count,
      recentQuestionIds: row.recent_question_ids ?? [],
      struggledQuestionIds: row.struggled_question_ids ?? [],
    };
  }

  const scoreStrike: ProgressState['scoreStrike'] = {};
  for (const row of scoreStrikeRows ?? []) {
    scoreStrike[row.topic_id] = {
      bestScore: row.best_score,
      bestAtISO: row.best_at ?? new Date(0).toISOString(),
      playCount: row.play_count,
      recentQuestionIds: row.recent_question_ids ?? [],
    };
  }

  return {
    version: 4,
    xpTotal: progressRow.xp_total,
    streak: {
      current: progressRow.streak_current,
      longest: progressRow.streak_longest,
      lastCompletedDateISO: progressRow.streak_last_completed_date,
    },
    lessons,
    scoreStrike,
    // Srca, dnevni izazov i mastery se ne sinkroniziraju (lokalno po uređaju) -
    // mergeProgress uvijek uzima lokalnu stranu, ovi defaulti nikad ne pobjeđuju.
    // Popis grešaka (struggledQuestionIds) SE sinkronizira, pa ponavljanje
    // preživi prijavu na drugom uređaju i bez sinkroniziranog mastery-ja.
    mastery: {},
    lessonCounter: 0,
    hearts: { balance: 5, lastRegenAtISO: null },
    dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
    updatedAtISO: progressRow.updated_at,
  };
}

/**
 * Best-effort upsert cijelog stanja. NAPOMENA: bez optimističkog zaključavanja
 * (WHERE updated_at = $prev) opisanog u planu - poznat, dokumentiran propust
 * za rijedak slučaj dva istovremena logina koji bi jedan mogao prepisati
 * drugi. Prihvatljivo za v1 (login se ne događa često), fast-follow ako
 * postane stvaran problem u praksi.
 */
export async function pushCloudProgress(userId: string, state: ProgressState): Promise<void> {
  if (!supabase) return;

  const progressResult = await supabase.from('progress').upsert({
    user_id: userId,
    xp_total: state.xpTotal,
    streak_current: state.streak.current,
    streak_longest: state.streak.longest,
    streak_last_completed_date: state.streak.lastCompletedDateISO,
    updated_at: state.updatedAtISO,
  });
  throwIfFailed('upis progress reda', progressResult.error);

  const lessonRows = Object.entries(state.lessons).map(([topicId, p]) => ({
    user_id: userId,
    topic_id: topicId,
    pass_count: p.passCount,
    fail_count: p.failCount,
    recent_question_ids: p.recentQuestionIds,
    struggled_question_ids: p.struggledQuestionIds,
  }));
  if (lessonRows.length > 0) {
    const { error } = await supabase.from('lesson_progress').upsert(lessonRows);
    throwIfFailed('upis lesson_progress redova', error);
  }

  const scoreStrikeRows = Object.entries(state.scoreStrike).map(([topicId, p]) => ({
    user_id: userId,
    topic_id: topicId,
    best_score: p.bestScore,
    best_at: p.bestAtISO,
    play_count: p.playCount,
    recent_question_ids: p.recentQuestionIds,
  }));
  if (scoreStrikeRows.length > 0) {
    const { error } = await supabase.from('score_strike_progress').upsert(scoreStrikeRows);
    throwIfFailed('upis score_strike_progress redova', error);
  }
}

/**
 * Poziva se jednom pri detekciji novog logina. Nema cloud reda -> gost-
 * napredak postaje početno cloud stanje (ništa se ne gubi). Postoji cloud
 * red -> mergeProgress (idempotentno, max/streak-day-diff pravila).
 */
export async function mergeAndSyncOnLogin(userId: string, localState: ProgressState): Promise<ProgressState> {
  const remoteState = await fetchCloudProgress(userId);
  const merged = remoteState ? mergeProgress(localState, remoteState) : localState;
  await pushCloudProgress(userId, merged);
  return merged;
}
