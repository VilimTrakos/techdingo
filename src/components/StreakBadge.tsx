export interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const safeStreak = Number.isFinite(streak) ? Math.max(0, Math.trunc(streak)) : 0;

  return (
    <div
      aria-label={`Aktivni niz: ${safeStreak} dana`}
      className="inline-flex min-h-10 items-center gap-2 rounded-2xl border-2 border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-black text-orange-900 shadow-[0_3px_0_#fdba74]"
      title="Dnevni niz"
    >
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-lg bg-orange-200 text-base"
      >
        🔥
      </span>
      <span className="tabular-nums">{safeStreak}</span>
      <span className="hidden font-extrabold text-orange-800 sm:inline">dana</span>
    </div>
  );
}

export default StreakBadge;
