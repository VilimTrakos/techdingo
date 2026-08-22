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
}

interface ScoreStrikeProgressRow {
  topic_id: string;
  best_score: number;
  best_at: string | null;
  play_count: number;
  recent_question_ids: string[] | null;
}

/** `null` ako korisnik još nema cloud red (npr. prvi login nakon registracije). */
export async function fetchCloudProgress(userId: string): Promise<ProgressState | null> {
  if (!supabase) return null;

  const [{ data: progressRow }, { data: lessonRows }, { data: scoreStrikeRows }] = await Promise.all([
    supabase.from('progress').select('*').eq('user_id', userId).maybeSingle<ProgressRow>(),
    supabase.from('lesson_progress').select('*').eq('user_id', userId).returns<LessonProgressRow[]>(),
    supabase.from('score_strike_progress').select('*').eq('user_id', userId).returns<ScoreStrikeProgressRow[]>(),
  ]);

  if (!progressRow) return null;

  const lessons: ProgressState['lessons'] = {};
  for (const row of lessonRows ?? []) {
    lessons[row.topic_id] = {
      passCount: row.pass_count,
      failCount: row.fail_count,
      recentQuestionIds: row.recent_question_ids ?? [],
      // Ne sinkronizira se u cloud - merge svejedno zadržava lokalnu stranu
      // kad je lokalno aktivnija (vidi mergeLessonProgress).
      struggledQuestionIds: [],
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
    version: 2,
    xpTotal: progressRow.xp_total,
    streak: {
      current: progressRow.streak_current,
      longest: progressRow.streak_longest,
      lastCompletedDateISO: progressRow.streak_last_completed_date,
    },
    lessons,
    scoreStrike,
    // Srca i dnevni izazov se ne sinkroniziraju (lokalno po uređaju) -
    // mergeProgress uvijek uzima lokalnu stranu, ovi defaulti nikad ne pobjeđuju.
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

  await supabase.from('progress').upsert({
    user_id: userId,
    xp_total: state.xpTotal,
    streak_current: state.streak.current,
    streak_longest: state.streak.longest,
    streak_last_completed_date: state.streak.lastCompletedDateISO,
    updated_at: state.updatedAtISO,
  });

  const lessonRows = Object.entries(state.lessons).map(([topicId, p]) => ({
    user_id: userId,
    topic_id: topicId,
    pass_count: p.passCount,
    fail_count: p.failCount,
    recent_question_ids: p.recentQuestionIds,
  }));
  if (lessonRows.length > 0) {
    await supabase.from('lesson_progress').upsert(lessonRows);
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
    await supabase.from('score_strike_progress').upsert(scoreStrikeRows);
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
