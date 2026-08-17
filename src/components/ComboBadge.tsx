export interface ComboBadgeProps {
  combo: number;
}

export function ComboBadge({ combo }: ComboBadgeProps) {
  const safeCombo = Number.isFinite(combo) ? Math.max(0, Math.trunc(combo)) : 0;
  const isActive = safeCombo >= 2;
  const isHot = safeCombo >= 5;
  const badgeStyle = isHot
    ? 'border-orange-400 bg-orange-50 text-orange-900 shadow-[0_4px_0_#fb923c] motion-safe:scale-105'
    : isActive
      ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-[0_4px_0_#fbbf24] motion-safe:scale-[1.03]'
      : 'border-sky-200 bg-white text-sky-800 shadow-[0_3px_0_#bae6fd]';

  return (
    <div
      aria-atomic="true"
      aria-label={`Combo: ${safeCombo}${isHot ? ', u žaru' : ''}`}
      className={`inline-flex min-h-10 items-center gap-2 rounded-2xl border-2 px-3 py-1.5 text-sm font-black transition-[transform,box-shadow,background-color] duration-200 motion-reduce:transform-none motion-reduce:transition-none ${badgeStyle}`}
      role="status"
    >
      <span
        aria-hidden="true"
        className={`grid size-6 place-items-center rounded-lg text-sm ${
          isHot ? 'bg-orange-200' : isActive ? 'bg-amber-200' : 'bg-sky-100'
        }`}
      >
        {isHot ? '🔥' : '⚡'}
      </span>
      <span
        className={`tabular-nums ${
          isActive
            ? 'motion-safe:animate-bounce motion-safe:[animation-duration:400ms] motion-safe:[animation-iteration-count:1]'
            : ''
        }`}
        key={safeCombo}
      >
        Combo ×{safeCombo}
      </span>
      {isHot && (
        <span className="hidden text-[0.65rem] tracking-wider text-orange-700 uppercase sm:inline">
          U žaru!
        </span>
      )}
    </div>
  );
}

export default ComboBadge;
