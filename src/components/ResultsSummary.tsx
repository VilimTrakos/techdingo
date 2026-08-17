import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type ResultsVariant = 'passed' | 'failed' | 'score';

export interface ResultsSummaryProps {
  variant: ResultsVariant;
  title?: string;
  correctCount?: number;
  totalCount?: number;
  score?: number;
  isNewBest?: boolean;
  xpEarned?: number;
  children?: ReactNode;
  onRestart?: () => void;
  restartLabel?: string;
  homeHref?: string | null;
}

const variantContent: Record<
  ResultsVariant,
  { defaultTitle: string; icon: string; iconClass: string; borderClass: string }
> = {
  passed: {
    defaultTitle: 'Lekcija završena!',
    icon: '✓',
    iconClass: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    borderClass: 'border-emerald-200',
  },
  failed: {
    defaultTitle: 'Ponestalo ti je srca',
    icon: '♥',
    iconClass: 'bg-rose-50 text-rose-600 ring-rose-200',
    borderClass: 'border-rose-200',
  },
  score: {
    defaultTitle: 'Score Strike završen!',
    icon: '⚡',
    iconClass: 'bg-amber-50 text-amber-600 ring-amber-200',
    borderClass: 'border-amber-200',
  },
};

function safeWholeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function ResultsSummary({
  variant,
  title,
  correctCount,
  totalCount,
  score,
  isNewBest = false,
  xpEarned,
  children,
  onRestart,
  restartLabel = 'Pokušaj ponovno',
  homeHref = '/',
}: ResultsSummaryProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const visual = variantContent[variant];

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby={titleId}
      aria-live="polite"
      className={`mx-auto w-full max-w-2xl rounded-3xl border bg-white p-6 text-center shadow-card sm:p-10 ${visual.borderClass}`}
    >
      <span
        aria-hidden="true"
        className={`mx-auto grid size-20 place-items-center rounded-full text-4xl font-black ring-2 ring-inset ${visual.iconClass}`}
      >
        {visual.icon}
      </span>

      <h1
        ref={titleRef}
        id={titleId}
        className="mt-6 text-3xl font-black tracking-tight text-slate-900"
        tabIndex={-1}
      >
        {title ?? visual.defaultTitle}
      </h1>

      {isNewBest && (
        <p className="mx-auto mt-4 w-fit rounded-full bg-amber-300 px-4 py-1.5 text-sm font-black text-slate-900">
          Novi osobni rekord!
        </p>
      )}

      {(typeof correctCount === 'number' ||
        typeof score === 'number' ||
        typeof xpEarned === 'number') && (
        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          {typeof correctCount === 'number' && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <dt className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Točno</dt>
              <dd className="mt-1 text-2xl font-black text-slate-900">
                {safeWholeNumber(correctCount)}
                {typeof totalCount === 'number' && (
                  <span className="text-base text-slate-500">/{safeWholeNumber(totalCount)}</span>
                )}
              </dd>
            </div>
          )}

          {typeof score === 'number' && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <dt className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Bodovi</dt>
              <dd className="mt-1 text-2xl font-black text-amber-700 tabular-nums">
                {safeWholeNumber(score).toLocaleString('hr-HR')}
              </dd>
            </div>
          )}

          {typeof xpEarned === 'number' && (
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <dt className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">Osvojeno</dt>
              <dd className="mt-1 text-2xl font-black text-violet-700 tabular-nums">
                +{safeWholeNumber(xpEarned).toLocaleString('hr-HR')} XP
              </dd>
            </div>
          )}
        </dl>
      )}

      {children && <div className="mt-6 text-slate-600">{children}</div>}

      {(onRestart || homeHref) && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {onRestart && (
            <button
              className="min-h-12 rounded-xl bg-indigo-600 px-5 py-3 font-extrabold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={onRestart}
              type="button"
            >
              {restartLabel}
            </button>
          )}
          {homeHref && (
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              to={homeHref}
            >
              Natrag na početnu
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default ResultsSummary;
