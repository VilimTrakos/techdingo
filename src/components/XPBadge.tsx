export interface XPBadgeProps {
  xp: number;
}

export function XPBadge({ xp }: XPBadgeProps) {
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.trunc(xp)) : 0;

  return (
    <div
      aria-label={`Ukupno iskustvo: ${safeXp} XP`}
      className="inline-flex min-h-10 items-center gap-2 rounded-2xl border-2 border-cyan-300 bg-cyan-50 px-3 py-1.5 text-sm font-black text-cyan-950 shadow-[0_3px_0_#67e8f9]"
      title="Ukupni XP"
    >
      <span
        aria-hidden="true"
        className="grid size-6 place-items-center rounded-lg bg-cyan-200"
      >
        ✦
      </span>
      <span className="tabular-nums">{safeXp.toLocaleString('hr-HR')}</span>
      <span className="text-cyan-800">XP</span>
    </div>
  );
}

export default XPBadge;
