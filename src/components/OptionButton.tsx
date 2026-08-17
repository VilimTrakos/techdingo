import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'disabled';

export interface OptionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  children: ReactNode;
  index: number;
  state?: OptionState;
}

const stateStyles: Record<OptionState, string> = {
  idle:
    'border-sky-200 bg-white text-slate-800 shadow-[0_5px_0_#bae6fd] hover:-translate-y-0.5 hover:border-sky-400 hover:bg-sky-50 hover:shadow-[0_6px_0_#7dd3fc] active:translate-y-1 active:shadow-[0_1px_0_#7dd3fc]',
  selected:
    'border-amber-400 bg-amber-50 text-amber-950 shadow-[0_5px_0_#f59e0b] motion-safe:-translate-y-0.5',
  correct:
    'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-[0_5px_0_#059669] motion-safe:scale-[1.01]',
  incorrect:
    'border-rose-500 bg-orange-50 text-rose-950 shadow-[0_5px_0_#e11d48] motion-safe:-rotate-[0.35deg]',
  disabled:
    'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500 shadow-[0_4px_0_#cbd5e1] opacity-80',
};

const markerStyles: Record<OptionState, string> = {
  idle: 'border-sky-200 bg-sky-50 text-sky-800 group-hover:border-sky-400',
  selected: 'border-amber-500 bg-amber-400 text-amber-950',
  correct: 'border-emerald-600 bg-emerald-500 text-white',
  incorrect: 'border-rose-600 bg-rose-500 text-white',
  disabled: 'border-slate-200 bg-slate-100 text-slate-500',
};

const resultIconStyles: Partial<Record<OptionState, string>> = {
  selected: 'border-amber-400 bg-amber-100 text-amber-800',
  correct: 'border-emerald-400 bg-emerald-100 text-emerald-800',
  incorrect: 'border-rose-400 bg-rose-100 text-rose-800',
};

function optionLabel(index: number) {
  return index >= 0 && index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

function stateAnnouncement(state: OptionState) {
  if (state === 'correct') return ' Točan odgovor.';
  if (state === 'incorrect') return ' Netočan odgovor.';
  if (state === 'selected') return ' Odabrani odgovor.';
  return '';
}

function stateIcon(state: OptionState) {
  if (state === 'correct') return '✓';
  if (state === 'incorrect') return '×';
  if (state === 'selected') return '●';
  return null;
}

export function OptionButton({
  children,
  index,
  state = 'idle',
  disabled = false,
  className = '',
  ...buttonProps
}: OptionButtonProps) {
  const isDisabled = disabled || state === 'disabled';
  const resultIcon = stateIcon(state);

  return (
    <button
      {...buttonProps}
      aria-pressed={state === 'selected' ? true : undefined}
      className={`group flex min-h-15 w-full items-center gap-4 rounded-2xl border-[3px] px-4 py-3 text-left font-extrabold transition-[transform,box-shadow,border-color,background-color] duration-150 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-sky-500 disabled:pointer-events-none motion-reduce:transform-none motion-reduce:transition-none ${stateStyles[state]} ${className}`}
      disabled={isDisabled}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-xl border-2 text-sm font-black transition-colors ${markerStyles[state]}`}
      >
        {optionLabel(index)}
      </span>
      <span className="flex-1">{children}</span>
      {resultIcon && (
        <span
          aria-hidden="true"
          className={`grid size-8 shrink-0 place-items-center rounded-full border-2 text-lg font-black motion-safe:animate-bounce motion-safe:[animation-duration:350ms] motion-safe:[animation-iteration-count:1] ${resultIconStyles[state] ?? ''}`}
        >
          {resultIcon}
        </span>
      )}
      <span className="sr-only">{stateAnnouncement(state)}</span>
    </button>
  );
}

export default OptionButton;
