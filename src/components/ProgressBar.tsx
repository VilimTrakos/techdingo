export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
}

export function ProgressBar({
  value,
  max,
  label = 'Napredak',
  showValue = false,
}: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 1;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  const percentage = (safeValue / safeMax) * 100;
  const isComplete = percentage >= 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-extrabold tracking-wide uppercase">
        <span className={isComplete ? 'text-emerald-700' : 'text-slate-600'}>
          {label}
          {isComplete && (
            <span aria-hidden="true" className="ml-1.5">
              ✓
            </span>
          )}
        </span>
        {showValue && (
          <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-mono text-emerald-800 tabular-nums ring-1 ring-emerald-200">
            {Math.round(safeValue)}/{Math.round(safeMax)}
          </span>
        )}
      </div>
      <div
        aria-label={label}
        aria-valuemax={safeMax}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        aria-valuetext={`${Math.round(percentage)} %`}
        className="h-5 overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50 p-0.5 shadow-[0_3px_0_#bbf7d0]"
        role="progressbar"
      >
        <div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 shadow-[inset_0_-2px_0_rgba(4,120,87,0.28)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-1 top-0.5 h-1 rounded-full bg-white/45"
          />
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
