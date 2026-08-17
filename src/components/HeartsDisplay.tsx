export interface HeartsDisplayProps {
  hearts: number;
  maxHearts?: number;
}

function normaliseHeartCount(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : fallback;
}

export function HeartsDisplay({ hearts, maxHearts = 5 }: HeartsDisplayProps) {
  const safeMax = Math.max(1, normaliseHeartCount(maxHearts, 5));
  const safeHearts = Math.min(safeMax, normaliseHeartCount(hearts, 0));

  return (
    <div
      aria-label={`Preostala srca: ${safeHearts} od ${safeMax}`}
      className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5"
      role="status"
    >
      <span aria-hidden="true" className="flex gap-0.5 text-lg leading-none">
        {Array.from({ length: safeMax }, (_, index) => (
          <span
            className={index < safeHearts ? 'text-rose-500' : 'text-slate-300'}
            key={index}
          >
            ♥
          </span>
        ))}
      </span>
      <span className="ml-1 text-sm font-black text-rose-700">
        {safeHearts}/{safeMax}
      </span>
    </div>
  );
}

export default HeartsDisplay;
