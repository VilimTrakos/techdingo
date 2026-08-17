import type { ProgressStateV1 } from './progressTypes';

export type Streak = ProgressStateV1['streak'];

/** Lokalni YYYY-MM-DD (ne UTC) za dani Date, default danas. */
export function toLocalDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(`${aISO}T00:00:00`);
  const b = new Date(`${bISO}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Čista funkcija: primijeni jedno "dovršenje sesije" na streak.
 * Isti dan = no-op (već brojano danas). Točno +1 dan = increment.
 * Veći razmak (ili prvi ikad) = reset na 1.
 */
export function applyStreak(streak: Streak, completionDate: Date = new Date()): Streak {
  const todayISO = toLocalDateISO(completionDate);

  if (streak.lastCompletedDateISO === null) {
    return { current: 1, longest: Math.max(1, streak.longest), lastCompletedDateISO: todayISO };
  }

  const diff = daysBetween(streak.lastCompletedDateISO, todayISO);

  if (diff <= 0) {
    // Isti dan, ili sat lokalno vratio unatrag - ne diramo postojeći streak.
    return streak;
  }
  if (diff === 1) {
    const current = streak.current + 1;
    return { current, longest: Math.max(streak.longest, current), lastCompletedDateISO: todayISO };
  }
  return { current: 1, longest: Math.max(1, streak.longest), lastCompletedDateISO: todayISO };
}
