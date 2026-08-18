import { Link } from 'react-router-dom';

export type LearningPathTone = 'sql' | 'frontend' | 'backend' | 'general';

export interface LearningPathItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: LearningPathTone;
  questionCount: number;
  passCount: number;
  bestScore: number;
}

export interface LearningPathProps {
  items: LearningPathItem[];
  currentItemId: string | null;
}

const toneStyles: Record<
  LearningPathTone,
  { node: string; card: string; badge: string; iconSurface: string }
> = {
  sql: {
    node: 'border-cyan-700 bg-cyan-400 text-cyan-950 shadow-[0_7px_0_#0e7490]',
    card: 'border-cyan-200 bg-cyan-50/70',
    badge: 'bg-cyan-100 text-cyan-900',
    iconSurface: 'bg-cyan-100 text-cyan-900',
  },
  frontend: {
    node: 'border-amber-600 bg-amber-400 text-amber-950 shadow-[0_7px_0_#b45309]',
    card: 'border-amber-200 bg-amber-50/75',
    badge: 'bg-amber-100 text-amber-900',
    iconSurface: 'bg-amber-100 text-amber-900',
  },
  backend: {
    node: 'border-orange-800 bg-orange-500 text-white shadow-[0_7px_0_#9a3412]',
    card: 'border-orange-200 bg-orange-50/75',
    badge: 'bg-orange-100 text-orange-950',
    iconSurface: 'bg-orange-100 text-orange-950',
  },
  general: {
    node: 'border-brand-700 bg-brand-500 text-white shadow-[0_7px_0_#1e7430]',
    card: 'border-brand-200 bg-brand-50/75',
    badge: 'bg-brand-100 text-brand-800',
    iconSurface: 'bg-brand-100 text-brand-800',
  },
};

export function LearningPath({ items, currentItemId }: LearningPathProps) {
  return (
    <ol className="learning-path" aria-label="Put učenja po temama">
      {items.map((item, index) => {
        const completed = item.passCount > 0;
        const isCurrent = item.id === currentItemId;
        const colors = toneStyles[item.tone];
        const status = completed
          ? `Završeno ${item.passCount} puta`
          : isCurrent
            ? 'Sljedeći korak'
            : 'Otključano';

        return (
          <li key={item.id} className="learning-path-step">
            <Link
              to={`/lesson/${item.id}`}
              className={`learning-path-node ${colors.node} ${isCurrent ? 'learning-path-node-current' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`${index + 1}. ${item.title}. ${status}. Pokreni lekciju.`}
            >
              <span className="text-2xl font-black" aria-hidden="true">
                {completed ? '✓' : item.icon}
              </span>
              <span
                className="absolute -bottom-4 rounded-full border-2 border-white bg-ink-950 px-2.5 py-0.5 text-[0.65rem] font-black tracking-wide text-white shadow-sm"
                aria-hidden="true"
              >
                {index + 1}
              </span>
            </Link>

            <article className={`learning-path-card ${colors.card}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${colors.badge}`}
                >
                  {status}
                </span>
                <span className="text-xs font-extrabold text-ink-600">
                  {item.questionCount} pitanja
                </span>
              </div>

              <div className="mt-3 flex items-start gap-3">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-black ${colors.iconSurface}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-black tracking-tight text-ink-950 sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink-600">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-extrabold text-ink-600">
                <span>
                  <span aria-hidden="true">🏁</span> {item.passCount} prolaza
                </span>
                <span>
                  <span aria-hidden="true">🏆</span> {item.bestScore.toLocaleString('hr-HR')} bodova
                </span>
              </div>

              <div className="mt-5 grid gap-3 min-[440px]:grid-cols-2">
                <Link
                  to={`/lesson/${item.id}`}
                  className="game-button game-button-primary"
                >
                  {completed ? 'Ponovi lekciju' : 'Kreni učiti'}
                </Link>
                <Link
                  to={`/score-strike/${item.id}`}
                  className="game-button game-button-secondary"
                >
                  Score Strike
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

export default LearningPath;
