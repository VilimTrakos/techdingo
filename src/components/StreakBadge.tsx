export interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const safeStreak = Number.isFinite(streak) ? Math.max(0, Math.trunc(streak)) : 0;

  return (
    <div
      aria-label={`Aktivni niz: ${safeStreak} dana`}
      className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-black text-orange-800"
      title="Dnevni niz"
    >
      <span aria-hidden="true" className="text-base">
        🔥
      </span>
      <span className="tabular-nums">{safeStreak}</span>
      <span className="hidden font-bold text-orange-700 sm:inline">dana</span>
    </div>
  );
}

export default StreakBadge;
