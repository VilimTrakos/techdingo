export interface ComboBadgeProps {
  combo: number;
}

export function ComboBadge({ combo }: ComboBadgeProps) {
  const safeCombo = Number.isFinite(combo) ? Math.max(0, Math.trunc(combo)) : 0;
  const isActive = safeCombo >= 2;

  return (
    <div
      aria-label={`Combo: ${safeCombo}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black transition ${
        isActive
          ? 'border-amber-300 bg-amber-50 text-amber-800 shadow-sm shadow-amber-200'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
      role="status"
    >
      <span aria-hidden="true">⚡</span>
      <span>Combo ×{safeCombo}</span>
    </div>
  );
}

export default ComboBadge;
