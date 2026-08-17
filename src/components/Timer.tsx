export interface TimerProps {
  remainingMs: number;
  totalMs: number;
}

export function Timer({ remainingMs, totalMs }: TimerProps) {
  const safeTotal = Number.isFinite(totalMs) && totalMs > 0 ? totalMs : 1;
  const safeRemaining = Number.isFinite(remainingMs)
    ? Math.min(safeTotal, Math.max(0, remainingMs))
    : 0;
  const percentage = (safeRemaining / safeTotal) * 100;
  const seconds = Math.ceil(safeRemaining / 1000);
  const isCritical = percentage <= 10;
  const isWarning = percentage <= 30;
  const barColor = isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-cyan-400';
  const textColor = isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-cyan-700';

  return (
    <div
      aria-label={`Preostalo vrijeme: ${seconds} sekundi`}
      aria-live="off"
      className="w-full"
      role="timer"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold tracking-widest text-slate-500 uppercase">Vrijeme</span>
        <span className={`font-mono text-lg font-black tabular-nums ${textColor}`}>{seconds} s</span>
      </div>
      <div
        aria-hidden="true"
        className="h-3 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default Timer;
