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
  const barColor = isCritical
    ? 'from-orange-500 to-rose-500'
    : isWarning
      ? 'from-yellow-400 to-amber-500'
      : 'from-sky-400 to-cyan-500';
  const textColor = isCritical
    ? 'text-orange-800'
    : isWarning
      ? 'text-amber-800'
      : 'text-sky-800';
  const trackColor = isCritical
    ? 'border-orange-300 bg-orange-50 shadow-[0_3px_0_#fdba74]'
    : isWarning
      ? 'border-amber-300 bg-amber-50 shadow-[0_3px_0_#fde68a]'
      : 'border-sky-200 bg-sky-50 shadow-[0_3px_0_#bae6fd]';
  const timeBadgeColor = isCritical
    ? 'border-orange-300 bg-orange-50'
    : isWarning
      ? 'border-amber-300 bg-amber-50'
      : 'border-sky-200 bg-white';

  return (
    <div
      aria-atomic="true"
      aria-label={`Preostalo vrijeme: ${seconds} sekundi`}
      aria-live="off"
      className="w-full"
      role="timer"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-widest text-slate-600 uppercase">
          <span aria-hidden="true">⏱</span>
          Vrijeme
        </span>
        <span
          className={`rounded-xl border-2 px-2.5 py-0.5 font-mono text-lg font-black tabular-nums shadow-sm transition-colors ${textColor} ${timeBadgeColor} ${
            isCritical ? 'motion-safe:animate-pulse' : ''
          }`}
        >
          {seconds} s
        </span>
      </div>
      <div
        aria-hidden="true"
        className={`h-5 overflow-hidden rounded-full border-2 p-0.5 transition-colors ${trackColor}`}
      >
        <div
          className={`relative h-full overflow-hidden rounded-full bg-gradient-to-r shadow-[inset_0_-2px_0_rgba(15,23,42,0.18)] transition-[width] duration-100 ease-linear motion-reduce:transition-none ${barColor}`}
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

export default Timer;
