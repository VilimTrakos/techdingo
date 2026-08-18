import type { ProgressStateV1, TopicLessonProgress, TopicScoreStrikeProgress } from './progressTypes';
import type { Streak } from './streak';
import { daysBetween } from './streak';

/**
 * Spaja streakove s dva uređaja. NE "novija strana pobjeđuje" - ta verzija
 * gubi dane kad su zadnji-aktivni datumi točno 1 dan razmaknuti (čest
 * slučaj, ne rubni: korisnik naizmjenično koristi dva uređaja koja se nisu
 * stigla sinkronizirati). Umjesto toga produžuje applyStreak-ovu day-diff
 * logiku: diff 0 = uzmi veći current (isti dan, dvostruko brojano), diff 1
 * = nastavak niza (zbroji), diff >1 = novija strana pobjeđuje (niz je
 * stvarno prekinut).
 */
export function mergeStreak(a: Streak, b: Streak): Streak {
  if (a.lastCompletedDateISO === null) return b;
  if (b.lastCompletedDateISO === null) return a;

  const aDate = a.lastCompletedDateISO;
  const bDate = b.lastCompletedDateISO;
  const [older, olderDate, newer, newerDate] = aDate <= bDate ? [a, aDate, b, bDate] : [b, bDate, a, aDate];
  const diff = daysBetween(olderDate, newerDate);

  const current = diff === 0 ? Math.max(a.current, b.current) : diff === 1 ? newer.current + older.current : newer.current;

  return {
    current,
    longest: Math.max(a.longest, b.longest, current),
    lastCompletedDateISO: newerDate,
  };
}

function mergeLessonProgress(a: TopicLessonProgress | undefined, b: TopicLessonProgress | undefined): TopicLessonProgress {
  if (!a) return b!;
  if (!b) return a;
  const aTotal = a.passCount + a.failCount;
  const bTotal = b.passCount + b.failCount;
  return {
    // max, ne sum - sync nije jednokratan događaj, sum bi duplicirao brojeve na ponovljenom mergeu.
    passCount: Math.max(a.passCount, b.passCount),
    failCount: Math.max(a.failCount, b.failCount),
    recentQuestionIds: aTotal >= bTotal ? a.recentQuestionIds : b.recentQuestionIds,
  };
}

function mergeScoreStrikeProgress(
  a: TopicScoreStrikeProgress | undefined,
  b: TopicScoreStrikeProgress | undefined,
): TopicScoreStrikeProgress {
  if (!a) return b!;
  if (!b) return a;
  const aWins = a.bestScore >= b.bestScore;
  return {
    bestScore: Math.max(a.bestScore, b.bestScore),
    bestAtISO: aWins ? a.bestAtISO : b.bestAtISO,
    playCount: Math.max(a.playCount, b.playCount),
    recentQuestionIds: a.playCount >= b.playCount ? a.recentQuestionIds : b.recentQuestionIds,
  };
}

/**
 * Spaja lokalno i cloud stanje pri loginu na novom/drugom uređaju. Idempotentno
 * (max/streak-day-diff, ne sum) - siguran za ponovljeni poziv. Ne mutira ulaze.
 */
export function mergeProgress(local: ProgressStateV1, remote: ProgressStateV1, now: Date = new Date()): ProgressStateV1 {
  const lessons: ProgressStateV1['lessons'] = {};
  for (const topicId of new Set([...Object.keys(local.lessons), ...Object.keys(remote.lessons)])) {
    lessons[topicId] = mergeLessonProgress(local.lessons[topicId], remote.lessons[topicId]);
  }

  const scoreStrike: ProgressStateV1['scoreStrike'] = {};
  for (const topicId of new Set([...Object.keys(local.scoreStrike), ...Object.keys(remote.scoreStrike)])) {
    scoreStrike[topicId] = mergeScoreStrikeProgress(local.scoreStrike[topicId], remote.scoreStrike[topicId]);
  }

  return {
    version: 1,
    xpTotal: Math.max(local.xpTotal, remote.xpTotal),
    streak: mergeStreak(local.streak, remote.streak),
    lessons,
    scoreStrike,
    updatedAtISO: now.toISOString(),
  };
}
