export interface XPBadgeProps {
  xp: number;
}

export function XPBadge({ xp }: XPBadgeProps) {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.trunc(xp)) : 0;

  return (
    <div
      aria-label={`Ukupno iskustvo: ${safeXp} XP`}
      className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-black text-violet-800"
      title="Ukupni XP"
    >
      <span aria-hidden="true">✦</span>
      <span className="tabular-nums">{safeXp.toLocaleString('hr-HR')}</span>
      <span className="text-violet-700">XP</span>
    </div>
  );
}

export default XPBadge;
