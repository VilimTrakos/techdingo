import { Link, useParams } from 'react-router-dom';
import { getTopic, getUnitQuestionCounts } from '../data/topics';
import { getUnitsForTopic, unitProgressKey } from '../data/units';
import { useProgress } from '../hooks/useProgress';

const TOPIC_TONE: Record<string, { badge: string; node: string; nodeLocked: string; card: string; hero: string; icon: string }> = {
  sql: {
    badge: 'bg-cyan-100 text-cyan-900',
    node: 'border-cyan-700 bg-cyan-400 text-cyan-950 shadow-[0_7px_0_#0e7490]',
    nodeLocked: 'border-cloud-200 bg-cloud-100 text-ink-400 shadow-[0_7px_0_#d5ddD2]',
    card: 'border-cyan-200 bg-cyan-50/70',
    hero: 'border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-sky-100 shadow-[0_7px_0_#67e8f9]',
    icon: '▤',
  },
  frontend: {
    badge: 'bg-amber-100 text-amber-900',
    node: 'border-amber-600 bg-amber-400 text-amber-950 shadow-[0_7px_0_#b45309]',
    nodeLocked: 'border-cloud-200 bg-cloud-100 text-ink-400 shadow-[0_7px_0_#d5ddd2]',
    card: 'border-amber-200 bg-amber-50/75',
    hero: 'border-amber-300 bg-gradient-to-br from-amber-50 via-white to-yellow-100 shadow-[0_7px_0_#fcd34d]',
    icon: '</>',
  },
  backend: {
    badge: 'bg-orange-100 text-orange-950',
    node: 'border-orange-800 bg-orange-500 text-white shadow-[0_7px_0_#9a3412]',
    nodeLocked: 'border-cloud-200 bg-cloud-100 text-ink-400 shadow-[0_7px_0_#d5ddd2]',
    card: 'border-orange-200 bg-orange-50/75',
    hero: 'border-orange-300 bg-gradient-to-br from-orange-50 via-white to-red-50 shadow-[0_7px_0_#fdba74]',
    icon: '⚙',
  },
  general: {
    badge: 'bg-brand-100 text-brand-800',
    node: 'border-brand-700 bg-brand-500 text-white shadow-[0_7px_0_#1e7430]',
    nodeLocked: 'border-cloud-200 bg-cloud-100 text-ink-400 shadow-[0_7px_0_#d5ddd2]',
    card: 'border-brand-200 bg-brand-50/75',
    hero: 'border-brand-300 bg-gradient-to-br from-brand-50 via-white to-emerald-50 shadow-[0_7px_0_#82df91]',
    icon: '✦',
  },
};

const FALLBACK_TONE = TOPIC_TONE.general;

/**
 * Put učenja unutar JEDNE teme: cjeline (podteme) poredane lako→teško,
 * otključavaju se redom - cjelina N traži barem jedan prolaz cjeline N-1.
 */
export function TopicPage() {
  const { topicId = '' } = useParams();
  const topic = getTopic(topicId);
  const { state } = useProgress();

  if (!topic) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-rose-200 bg-white p-8 text-center shadow-[0_6px_0_#fecdd3] sm:p-10">
        <p className="text-5xl" aria-hidden="true">🧭</p>
        <h1 className="mt-4 text-3xl font-black text-ink-950">Tema nije pronađena</h1>
        <Link to="/" className="game-button game-button-primary mt-6 px-6 py-3">
          Natrag na teme
        </Link>
      </div>
    );
  }

  const units = getUnitsForTopic(topic.id);
  const tone = TOPIC_TONE[topic.id] ?? FALLBACK_TONE;

  const questionCountByUnit = getUnitQuestionCounts(topic.id);

  const passCounts = units.map(
    (unit) => state.lessons[unitProgressKey(topic.id, unit.id)]?.passCount ?? 0,
  );
  // Prva neprođena cjelina je "trenutna"; sve iza nje su zaključane.
  const currentIndex = passCounts.findIndex((count) => count === 0);
  const allDone = currentIndex === -1;
  const completedCount = passCounts.filter((count) => count > 0).length;
  const progressPercent = Math.round((completedCount / Math.max(1, units.length)) * 100);

  return (
    <div className="space-y-10 pb-10">
      <header className={`hero-stage relative isolate mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border-[3px] px-6 py-8 text-center sm:px-10 sm:py-10 ${tone.hero}`}>
        <div className="absolute -right-14 -top-16 -z-10 size-48 rounded-full bg-white/70 blur-xl" aria-hidden="true" />
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-ink-600 transition hover:bg-cloud-100 hover:text-ink-950"
        >
          <span aria-hidden="true">←</span> Sve teme
        </Link>
        <div className={`mx-auto mt-3 grid size-20 place-items-center rounded-[1.75rem] border-[3px] border-white bg-white/85 text-3xl font-black shadow-[0_5px_0_rgba(23,32,42,0.14)] ${tone.badge}`} aria-hidden="true">
          {tone.icon}
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-ink-950 sm:text-5xl">
          {topic.labelHr}
        </h1>
        <p className="mt-2 font-bold text-ink-600">
          {units.length} cjelina · {topic.questionCount} pitanja · prolazi cjeline redom
        </p>
        <div className="mx-auto mt-4 flex max-w-md items-center gap-3 rounded-2xl border-2 border-white/90 bg-white/65 px-4 py-3 text-left shadow-sm backdrop-blur-sm">
          <span className="text-2xl" aria-hidden="true">{allDone ? '🏆' : '🗺️'}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-600">Napredak teme</p>
            <p className="font-black text-ink-950">{completedCount} / {units.length} cjelina</p>
          </div>
          <span className="text-sm font-black text-ink-600">{progressPercent}%</span>
        </div>
        <Link
          to={`/score-strike/${topic.id}`}
          className="game-button game-button-secondary mx-auto mt-5 max-w-xs px-6 py-3"
        >
          <span aria-hidden="true">⚡</span> Score Strike ({topic.labelHr})
        </Link>
      </header>

      <ol className="learning-path" aria-label={`Cjeline teme ${topic.labelHr}`}>
        {units.map((unit, index) => {
          const passCount = passCounts[index];
          const completed = passCount > 0;
          const isCurrent = index === currentIndex;
          const locked = !completed && !isCurrent;
          const status = completed
            ? `Završeno ${passCount}×`
            : isCurrent
              ? 'Sljedeći korak'
              : 'Zaključano';
          const lessonHref = `/lesson/${topic.id}/${unit.id}`;

          const nodeContent = (
            <>
              <span className="text-2xl font-black" aria-hidden="true">
                {completed ? '✓' : locked ? '🔒' : index + 1}
              </span>
              <span
                className="absolute -bottom-4 rounded-full border-2 border-white bg-ink-950 px-2.5 py-0.5 text-[0.65rem] font-black tracking-wide text-white shadow-sm"
                aria-hidden="true"
              >
                {index + 1}
              </span>
            </>
          );

          return (
            <li key={unit.id} className="learning-path-step">
              {locked ? (
                <span
                  className={`learning-path-node ${tone.nodeLocked}`}
                  aria-label={`${index + 1}. ${unit.labelHr}. Zaključano - prvo završi prethodnu cjelinu.`}
                >
                  {nodeContent}
                </span>
              ) : (
                <Link
                  to={lessonHref}
                  className={`learning-path-node ${tone.node} ${isCurrent ? 'learning-path-node-current' : ''}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${index + 1}. ${unit.labelHr}. ${status}. Pokreni lekciju.`}
                >
                  {nodeContent}
                </Link>
              )}

              <article className={`learning-path-card ${locked ? 'border-cloud-200 bg-cloud-50/80 opacity-75' : tone.card}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${locked ? 'bg-cloud-100 text-ink-400' : tone.badge}`}
                  >
                    {status}
                  </span>
                  <span className="text-xs font-extrabold text-ink-600">
                    {questionCountByUnit.get(unit.id) ?? 0} pitanja
                  </span>
                </div>

                <h2 className="mt-3 text-xl font-black tracking-tight text-ink-950 sm:text-2xl">
                  {unit.labelHr}
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink-600">
                  {unit.description}
                </p>

                {!locked && (
                  <div className="mt-4">
                    <Link to={lessonHref} className="game-button game-button-primary max-w-xs">
                      {completed ? 'Ponovi lekciju' : 'Kreni učiti'}
                    </Link>
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      {allDone && (
        <section className="mx-auto max-w-2xl rounded-[2rem] border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center shadow-[0_7px_0_#d69e18]">
          <p className="text-4xl" aria-hidden="true">🏆</p>
          <h2 className="mt-3 text-2xl font-black text-ink-950">
            Sve cjeline riješene!
          </h2>
          <p className="mt-2 font-semibold text-ink-600">
            Ponovi bilo koju cjelinu za vježbu ili postavi rekord u Score Strikeu.
          </p>
        </section>
      )}
    </div>
  );
}

export default TopicPage;
