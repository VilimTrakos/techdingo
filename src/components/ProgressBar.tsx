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

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-extrabold tracking-wide text-slate-500 uppercase">
        <span>{label}</span>
        {showValue && (
          <span className="font-mono text-slate-700 tabular-nums">
            {Math.round(safeValue)}/{Math.round(safeMax)}
          </span>
        )}
      </div>
      <div
        aria-label={label}
        aria-valuemax={safeMax}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className="h-3 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
