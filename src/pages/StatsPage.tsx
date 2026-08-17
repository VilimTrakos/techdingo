import { Link } from 'react-router-dom';
import { StreakBadge } from '../components/StreakBadge';
import { XPBadge } from '../components/XPBadge';
import { TOPICS } from '../data/topics';
import { useProgress } from '../hooks/useProgress';

function pluralizeAttempts(value: number) {
  if (value === 1) return 'pokušaj';
  if (value >= 2 && value <= 4) return 'pokušaja';
  return 'pokušaja';
}

export function StatsPage() {
  const { state } = useProgress();
  const totalPasses = Object.values(state.lessons).reduce(
    (total, progress) => total + progress.passCount,
    0,
  );
  const totalFails = Object.values(state.lessons).reduce(
    (total, progress) => total + progress.failCount,
    0,
  );
  const totalScoreStrikeRuns = Object.values(state.scoreStrike).reduce(
    (total, progress) => total + progress.playCount,
    0,
  );
  const hasActivity = totalPasses + totalFails + totalScoreStrikeRuns > 0;
  const scoreStrikeTopics = [
    ...TOPICS.map((topic) => ({ id: topic.id, label: topic.labelHr })),
    { id: 'mixed', label: 'Sve teme' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
          Tvoj napredak
        </p>
        <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Statistika
            </h1>
            <p className="mt-2 max-w-2xl font-medium leading-7 text-slate-600">
              Prati dovršene lekcije, niz aktivnosti i najbolje Score Strike
              rezultate na ovom uređaju.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StreakBadge streak={state.streak.current} />
            <XPBadge xp={state.xpTotal} />
          </div>
        </div>
      </header>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Pregled rezultata
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ukupni XP"
            value={state.xpTotal.toLocaleString('hr-HR')}
            icon="⚡"
          />
          <StatCard
            label="Trenutačni niz"
            value={`${state.streak.current} dana`}
            hint={`Najduži niz: ${state.streak.longest}`}
            icon="🔥"
          />
          <StatCard
            label="Prođene lekcije"
            value={totalPasses.toString()}
            hint={`${totalFails} neuspjelih pokušaja`}
            icon="🎓"
          />
          <StatCard
            label="Score Strike runde"
            value={totalScoreStrikeRuns.toString()}
            icon="⏱️"
          />
        </dl>
      </section>

      {!hasActivity && (
        <section className="rounded-[2rem] border border-dashed border-indigo-300 bg-indigo-50 p-8 text-center">
          <p className="text-4xl" aria-hidden="true">
            🚀
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-900">
            Tvoja statistika čeka prvi rezultat
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-medium leading-7 text-slate-600">
            Završi lekciju ili Score Strike rundu i ovdje ćeš vidjeti svoj
            napredak.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Započni vježbu
          </Link>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section
          aria-labelledby="lessons-heading"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="lessons-heading" className="text-2xl font-black text-slate-900">
            Lekcije po temama
          </h2>
          <div className="mt-5 divide-y divide-slate-100">
            {TOPICS.map((topic) => {
              const progress = state.lessons[topic.id];
              const passes = progress?.passCount ?? 0;
              const fails = progress?.failCount ?? 0;
              const attempts = passes + fails;
              const successRate = attempts > 0 ? Math.round((passes / attempts) * 100) : 0;

              return (
                <div
                  key={topic.id}
                  className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h3 className="font-black text-slate-900">{topic.labelHr}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {attempts} {pluralizeAttempts(attempts)} · {passes} uspješnih
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-[width]"
                        style={{ width: `${successRate}%` }}
                        role="progressbar"
                        aria-label={`Uspješnost za ${topic.labelHr}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={successRate}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <p className="text-2xl font-black tabular-nums text-emerald-600">
                      {successRate}%
                    </p>
                    <Link
                      to={`/lesson/${topic.id}`}
                      className="text-sm font-black text-indigo-600 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Vježbaj
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="scores-heading"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 id="scores-heading" className="text-2xl font-black text-slate-900">
            Score Strike rekordi
          </h2>
          <div className="mt-5 divide-y divide-slate-100">
            {scoreStrikeTopics.map((topic) => {
              const progress = state.scoreStrike[topic.id];
              const bestScore = progress?.bestScore ?? 0;
              const playCount = progress?.playCount ?? 0;

              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div>
                    <h3 className="font-black text-slate-900">{topic.label}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {playCount} odigranih rundi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black tabular-nums text-amber-600">
                      {bestScore.toLocaleString('hr-HR')}
                    </p>
                    <Link
                      to={`/score-strike/${topic.id}`}
                      className="text-sm font-black text-indigo-600 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Igraj
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
};

function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <dt className="text-sm font-bold text-slate-500">{label}</dt>
          <dd className="mt-2 text-3xl font-black tabular-nums text-slate-900">
            {value}
          </dd>
          {hint && <dd className="mt-1 text-xs font-semibold text-slate-600">{hint}</dd>}
        </div>
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default StatsPage;
