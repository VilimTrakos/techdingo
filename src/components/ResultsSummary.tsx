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
  {
    defaultTitle: string;
    icon: string;
    surfaceClass: string;
    badgeClass: string;
    eyebrow: string;
  }
> = {
  passed: {
    defaultTitle: 'Lekcija završena!',
    icon: '✓',
    surfaceClass: 'border-brand-300 bg-gradient-to-br from-brand-50 via-white to-lime-50',
    badgeClass: 'border-brand-800 bg-brand-500 text-white shadow-[0_4px_0_#185d28]',
    eyebrow: 'Misija uspješna',
  },
  failed: {
    defaultTitle: 'Ponestalo ti je srca',
    icon: '♥',
    surfaceClass: 'border-rose-300 bg-gradient-to-br from-rose-50 via-white to-orange-50',
    badgeClass: 'border-rose-800 bg-rose-500 text-white shadow-[0_4px_0_#9f1239]',
    eyebrow: 'Novi pokušaj čeka',
  },
  score: {
    defaultTitle: 'Score Strike završen!',
    icon: '⚡',
    surfaceClass: 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50',
    badgeClass: 'border-amber-800 bg-amber-400 text-amber-950 shadow-[0_4px_0_#a16207]',
    eyebrow: 'Runda završena',
  },
};

const confetti = [
  ['left-[6%]', 'bg-brand-500', 0],
  ['left-[15%]', 'bg-amber-400', 150],
  ['left-[25%]', 'bg-cyan-400', 300],
  ['left-[36%]', 'bg-orange-400', 75],
  ['left-[48%]', 'bg-brand-300', 500],
  ['left-[59%]', 'bg-amber-500', 200],
  ['left-[70%]', 'bg-cyan-500', 700],
  ['left-[81%]', 'bg-orange-500', 300],
  ['left-[91%]', 'bg-brand-500', 100],
] as const;

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
  const celebrate = variant === 'passed' || variant === 'score';
  const guideMarkSrc = `${import.meta.env.BASE_URL}tech-hedgehog.webp`;
  const restartClass =
    variant === 'score' ? 'game-button-boss' : 'game-button-primary';

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby={titleId}
      aria-live="polite"
      className={`relative isolate mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border-[3px] p-6 text-center shadow-[0_7px_0_rgba(23,32,42,0.14),0_24px_50px_rgba(23,32,42,0.10)] sm:p-10 ${visual.surfaceClass}`}
    >
      {celebrate && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {confetti.map(([position, color, delay], index) => (
            <span
              key={`${position}-${color}`}
              className={`result-confetti-piece ${position} ${color} ${
                index % 2 === 0 ? 'rounded-full' : 'rounded-sm'
              }`}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="relative mx-auto size-28">
          <span
            className="grid size-24 place-items-center overflow-hidden rounded-[2rem] border-[3px] border-ink-950 bg-white shadow-[0_5px_0_#17202a]"
            aria-hidden="true"
          >
            <img src={guideMarkSrc} alt="" className="size-[88%] object-contain" />
          </span>
          <span
            className={`absolute -bottom-1 -right-1 grid size-12 place-items-center rounded-2xl border-2 text-2xl font-black ${visual.badgeClass}`}
            aria-hidden="true"
          >
            {visual.icon}
          </span>
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-ink-600">
          {visual.eyebrow}
        </p>
        <h1
          ref={titleRef}
          id={titleId}
          className="mt-2 text-3xl font-black tracking-tight text-ink-950 focus-visible:outline-none sm:text-4xl"
          tabIndex={-1}
        >
          {title ?? visual.defaultTitle}
        </h1>

        {isNewBest && (
          <p className="mx-auto mt-4 w-fit rotate-[-1deg] rounded-xl border-2 border-amber-700 bg-amber-300 px-4 py-1.5 text-sm font-black text-amber-950 shadow-[0_3px_0_#a16207]">
            <span aria-hidden="true">🏆</span> Novi osobni rekord!
          </p>
        )}

        {(typeof correctCount === 'number' ||
          typeof score === 'number' ||
          typeof xpEarned === 'number') && (
          <dl className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
            {typeof correctCount === 'number' && (
              <div className="rounded-2xl border-2 border-cyan-200 bg-white/90 p-4 shadow-[0_4px_0_#a5f3fc]">
                <dt className="text-xs font-black uppercase tracking-wider text-cyan-800">
                  Točno
                </dt>
                <dd className="mt-1 text-2xl font-black text-ink-950">
                  {safeWholeNumber(correctCount)}
                  {typeof totalCount === 'number' && (
                    <span className="text-base text-ink-600">
                      /{safeWholeNumber(totalCount)}
                    </span>
                  )}
                </dd>
              </div>
            )}

            {typeof score === 'number' && (
              <div className="rounded-2xl border-2 border-amber-300 bg-white/90 p-4 shadow-[0_4px_0_#fcd34d]">
                <dt className="text-xs font-black uppercase tracking-wider text-amber-800">
                  Bodovi
                </dt>
                <dd className="mt-1 text-2xl font-black text-amber-800 tabular-nums">
                  {safeWholeNumber(score).toLocaleString('hr-HR')}
                </dd>
              </div>
            )}

            {typeof xpEarned === 'number' && (
              <div className="rounded-2xl border-2 border-brand-200 bg-white/90 p-4 shadow-[0_4px_0_#b8efc1]">
                <dt className="text-xs font-black uppercase tracking-wider text-brand-700">
                  Osvojeno
                </dt>
                <dd className="mt-1 text-2xl font-black text-brand-700 tabular-nums">
                  +{safeWholeNumber(xpEarned).toLocaleString('hr-HR')} XP
                </dd>
              </div>
            )}
          </dl>
        )}

        {children && <div className="mt-6 font-semibold text-ink-600">{children}</div>}

        {(onRestart || homeHref) && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {onRestart && (
              <button
                className={`game-button ${restartClass} px-5 py-3`}
                onClick={onRestart}
                type="button"
              >
                <span aria-hidden="true">↻</span> {restartLabel}
              </button>
            )}
            {homeHref && (
              <Link className="game-button game-button-ghost px-5 py-3" to={homeHref}>
                Natrag na put
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ResultsSummary;
