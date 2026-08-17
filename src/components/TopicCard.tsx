import { Link } from 'react-router-dom';

export type TopicAccent = 'sql' | 'frontend' | 'backend' | 'mixed' | (string & {});

export interface TopicCardProps {
  id: string;
  title: string;
  description: string;
  accent?: TopicAccent;
  questionCount?: number;
  lessonHref?: string | null;
  scoreStrikeHref?: string | null;
  bestScore?: number;
}

const accentStyles: Record<string, { border: string; badge: string; glow: string }> = {
  sql: {
    border: 'border-violet-200',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    glow: 'from-violet-100/80',
  },
  frontend: {
    border: 'border-sky-200',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
    glow: 'from-sky-100/80',
  },
  backend: {
    border: 'border-orange-200',
    badge: 'bg-orange-50 text-orange-700 ring-orange-200',
    glow: 'from-orange-100/80',
  },
  mixed: {
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    glow: 'from-amber-100/80',
  },
};

const fallbackAccent = {
  border: 'border-slate-200',
  badge: 'bg-slate-100 text-slate-700 ring-slate-200',
  glow: 'from-slate-100/80',
};

export function TopicCard({
  id,
  title,
  description,
  accent = id,
  questionCount,
  lessonHref = `/lesson/${id}`,
  scoreStrikeHref = `/score-strike/${id}`,
  bestScore,
}: TopicCardProps) {
  const colors = accentStyles[accent] ?? fallbackAccent;

  return (
    <article
      className={`relative isolate overflow-hidden rounded-3xl border bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lg ${colors.border}`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b to-transparent ${colors.glow}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold tracking-widest uppercase ring-1 ring-inset ${colors.badge}`}
          >
            {title}
          </span>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
        </div>

        {typeof questionCount === 'number' && (
          <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
            {questionCount} pitanja
          </span>
        )}
      </div>

      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{description}</p>

      {typeof bestScore === 'number' && (
        <p className="mt-4 text-sm font-semibold text-amber-800">
          Najbolji rezultat: <strong className="font-black">{bestScore.toLocaleString('hr-HR')}</strong>
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {lessonHref && (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            to={lessonHref}
          >
            Pokreni lekciju
          </Link>
        )}
        {scoreStrikeHref && (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-sm font-extrabold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            to={scoreStrikeHref}
          >
            Score Strike
          </Link>
        )}
      </div>
    </article>
  );
}

export default TopicCard;
