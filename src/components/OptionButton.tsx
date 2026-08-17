import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'disabled';

export interface OptionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  children: ReactNode;
  index: number;
  state?: OptionState;
}

const stateStyles: Record<OptionState, string> = {
  idle: 'border-slate-200 bg-white text-slate-800 hover:border-indigo-400 hover:bg-indigo-50',
  selected: 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-200',
  correct: 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-200',
  incorrect: 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-200',
  disabled: 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500 opacity-75',
};

const markerStyles: Record<OptionState, string> = {
  idle: 'border-slate-300 bg-slate-50 text-slate-600',
  selected: 'border-indigo-500 bg-indigo-600 text-white',
  correct: 'border-emerald-500 bg-emerald-500 text-white',
  incorrect: 'border-rose-500 bg-rose-500 text-white',
  disabled: 'border-slate-200 bg-slate-100 text-slate-400',
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

export function OptionButton({
  children,
  index,
  state = 'idle',
  disabled = false,
  className = '',
  ...buttonProps
}: OptionButtonProps) {
  const isDisabled = disabled || state === 'disabled';

  return (
    <button
      {...buttonProps}
      aria-pressed={state === 'selected' ? true : undefined}
      className={`group flex min-h-14 w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:pointer-events-none ${stateStyles[state]} ${className}`}
      disabled={isDisabled}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm font-black ${markerStyles[state]}`}
      >
        {optionLabel(index)}
      </span>
      <span className="flex-1">{children}</span>
      <span className="sr-only">{stateAnnouncement(state)}</span>
    </button>
  );
}

export default OptionButton;
