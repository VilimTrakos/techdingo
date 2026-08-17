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
  const isCritical = safeHearts <= 1;

  return (
    <div
      aria-atomic="true"
      aria-label={`Preostala srca: ${safeHearts} od ${safeMax}`}
      className={`inline-flex min-h-10 items-center gap-1 rounded-2xl border-2 px-3 py-1.5 shadow-[0_4px_0_#fda4af] transition-colors ${
        isCritical ? 'border-rose-400 bg-orange-50' : 'border-rose-200 bg-white'
      }`}
      role="status"
    >
      <span
        aria-hidden="true"
        className={`text-xl leading-none min-[380px]:hidden ${
          isCritical ? 'text-rose-600' : 'text-rose-500'
        }`}
      >
        ♥
      </span>
      <span
        aria-hidden="true"
        className="hidden gap-0.5 text-xl leading-none min-[380px]:flex"
      >
        {Array.from({ length: safeMax }, (_, index) => (
          <span
            className={`inline-block transition-[color,transform] duration-300 motion-reduce:transition-none ${
              index < safeHearts
                ? 'scale-100 text-rose-500 drop-shadow-[0_2px_0_#fecdd3]'
                : 'scale-90 text-slate-300'
            }`}
            key={index}
          >
            {index < safeHearts ? '♥' : '♡'}
          </span>
        ))}
      </span>
      <span className="ml-1 rounded-lg bg-rose-100 px-1.5 py-0.5 text-sm font-black text-rose-800 tabular-nums">
        {safeHearts}/{safeMax}
      </span>
    </div>
  );
}

export default HeartsDisplay;
