import { Link } from 'react-router-dom';
import { StreakBadge } from '../components/StreakBadge';
import { XPBadge } from '../components/XPBadge';
import { TOPICS } from '../data/topics';
import { useProgress } from '../hooks/useProgress';
import { ACHIEVEMENTS } from '../lib/achievements';

const TOPIC_META: Record<
  string,
  {
    icon: string;
    surface: string;
    scoreSurface: string;
    fill: string;
  }
> = {
  sql: {
    icon: '▤',
    surface: 'border-cyan-200 bg-cyan-50/70',
    scoreSurface: 'border-cyan-200 bg-cyan-50',
    fill: 'bg-cyan-500',
  },
  frontend: {
    icon: '</>',
    surface: 'border-amber-200 bg-amber-50/75',
    scoreSurface: 'border-amber-200 bg-amber-50',
    fill: 'bg-amber-500',
  },
  backend: {
    icon: '⚙',
    surface: 'border-orange-200 bg-orange-50/75',
    scoreSurface: 'border-orange-200 bg-orange-50',
    fill: 'bg-orange-500',
  },
  general: {
    icon: '✦',
    surface: 'border-brand-200 bg-brand-50/75',
    scoreSurface: 'border-brand-200 bg-brand-50',
    fill: 'bg-brand-500',
  },
};

const FALLBACK_META = TOPIC_META.general;

function pluralizeAttempts(value: number) {
  return value === 1 ? 'pokušaj' : 'pokušaja';
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
  const lessonAttempts = totalPasses + totalFails;
  const lessonSuccessRate =
    lessonAttempts > 0 ? Math.round((totalPasses / lessonAttempts) * 100) : 0;
  const hasActivity = lessonAttempts + totalScoreStrikeRuns > 0;
  const guideMarkSrc = `${import.meta.env.BASE_URL}tech-hedgehog.webp`;
  const scoreStrikeTopics = [
    ...TOPICS.map((topic) => ({ id: topic.id, label: topic.labelHr })),
    { id: 'mixed', label: 'Sve teme' },
  ];
  const earnedAchievements = ACHIEVEMENTS.filter((achievement) => achievement.earned(state));

  return (
    <div className="space-y-10 pb-10">
      <header className="relative isolate overflow-hidden rounded-[2rem] border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-6 shadow-[0_7px_0_#b8efc1,0_18px_45px_rgba(23,32,42,0.08)] sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 -z-10 size-56 rounded-full bg-amber-200/50 blur-3xl"
        />
        <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-700">
              Tvoja igra, tvoji brojevi
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-ink-950 sm:text-5xl">
              Statistika
            </h1>
            <p className="mt-3 max-w-2xl font-bold leading-7 text-ink-600">
              Prati osvojeni XP, seriju učenja i osobne rekorde. Svaki pokušaj
              gradi sljedeći korak.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StreakBadge streak={state.streak.current} />
              <XPBadge xp={state.xpTotal} />
            </div>
          </div>

          <div
            aria-hidden="true"
            className="mx-auto grid size-32 place-items-center overflow-hidden rounded-[2rem] border-[3px] border-ink-950 bg-white shadow-[0_6px_0_#17202a] sm:mx-0 sm:size-36"
          >
            <img src={guideMarkSrc} alt="" className="size-[92%] object-contain" />
          </div>
        </div>
      </header>

      <section aria-labelledby="overview-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">
              Brzi pregled
            </p>
            <h2 id="overview-heading" className="mt-1 text-2xl font-black text-ink-950">
              Tvoj rezultat dosad
            </h2>
          </div>
          <Link to="/" className="text-sm font-black text-brand-700 hover:underline">
            Nastavi učiti →
          </Link>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ukupni XP"
            value={state.xpTotal.toLocaleString('hr-HR')}
            icon="✦"
            tone="cyan"
          />
          <StatCard
            label="Trenutačni niz"
            value={`${state.streak.current} dana`}
            hint={`Najduži niz: ${state.streak.longest}`}
            icon="🔥"
            tone="orange"
          />
          <StatCard
            label="Prođene lekcije"
            value={totalPasses.toString()}
            hint={`${lessonSuccessRate}% uspješnosti`}
            icon="✓"
            tone="green"
          />
          <StatCard
            label="Score Strike runde"
            value={totalScoreStrikeRuns.toString()}
            icon="⚡"
            tone="amber"
          />
        </dl>
      </section>

      {!hasActivity && (
        <section className="rounded-[2rem] border-2 border-dashed border-brand-300 bg-brand-50 p-7 text-center shadow-[0_5px_0_#b8efc1] sm:p-9">
          <span
            className="mx-auto grid size-16 place-items-center rounded-2xl border-2 border-brand-700 bg-brand-200 text-3xl shadow-[0_4px_0_#1e7430]"
            aria-hidden="true"
          >
            ▶
          </span>
          <h2 className="mt-5 text-2xl font-black text-ink-950">
            Prvi rezultat čeka na tebe
          </h2>
          <p className="mx-auto mt-2 max-w-lg font-semibold leading-7 text-ink-600">
            Završi jednu kratku lekciju ili odigraj Score Strike rundu. Napredak
            će se odmah pojaviti ovdje.
          </p>
          <Link to="/" className="game-button game-button-primary mt-6 px-7">
            Započni prvu lekciju
          </Link>
        </section>
      )}

      <section aria-labelledby="lessons-heading">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">
            Put učenja
          </p>
          <h2 id="lessons-heading" className="mt-1 text-2xl font-black text-ink-950">
            Lekcije po temama
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TOPICS.map((topic) => {
            const topicLessonEntries = Object.entries(state.lessons)
              .filter(([key]) => key === topic.id || key.startsWith(`${topic.id}/`))
              .map(([, progress]) => progress);
            const passes = topicLessonEntries.reduce((total, progress) => total + progress.passCount, 0);
            const fails = topicLessonEntries.reduce((total, progress) => total + progress.failCount, 0);
            const attempts = passes + fails;
            const successRate =
              attempts > 0 ? Math.round((passes / attempts) * 100) : 0;
            const meta = TOPIC_META[topic.id] ?? FALLBACK_META;

            return (
              <article
                key={topic.id}
                className={`rounded-[1.75rem] border-2 p-5 shadow-[0_5px_0_rgba(23,32,42,0.10)] ${meta.surface}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid size-12 place-items-center rounded-2xl border-2 border-ink-950 bg-white text-lg font-black text-ink-950 shadow-[0_3px_0_#17202a]"
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-ink-600">
                    {attempts} {pluralizeAttempts(attempts)}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-black text-ink-950">{topic.labelHr}</h3>
                <p className="mt-1 text-sm font-bold text-ink-600">
                  {passes} prolaza · {fails} za ponoviti
                </p>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <p className="text-3xl font-black tabular-nums text-ink-950">
                    {successRate}%
                  </p>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-ink-600">
                    Uspješnost
                  </p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/5 bg-white/80">
                  <div
                    className={`h-full rounded-full transition-[width] ${meta.fill}`}
                    style={{ width: `${successRate}%` }}
                    role="progressbar"
                    aria-label={`Uspješnost za ${topic.labelHr}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={successRate}
                  />
                </div>

                <Link
                  to={`/topic/${topic.id}`}
                  className="game-button game-button-ghost mt-5 w-full"
                >
                  {attempts > 0 ? 'Ponovi lekciju' : 'Kreni učiti'}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="achievements-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
              Kolekcija uspjeha
            </p>
            <h2 id="achievements-heading" className="mt-1 text-2xl font-black text-ink-950">
              Značke
            </h2>
          </div>
          <p className="rounded-full border-2 border-violet-200 bg-violet-50 px-4 py-2 text-sm font-black text-violet-800">
            {earnedAchievements.length}/{ACHIEVEMENTS.length} osvojeno
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((achievement) => {
            const earned = achievement.earned(state);
            return (
              <article
                key={achievement.id}
                className={`relative overflow-hidden rounded-[1.75rem] border-2 p-5 transition ${
                  earned
                    ? 'border-violet-300 bg-gradient-to-br from-violet-50 via-white to-amber-50 shadow-[0_5px_0_#c4b5fd]'
                    : 'border-cloud-200 bg-cloud-50 text-ink-400 grayscale'
                }`}
              >
                {earned && <span className="absolute right-3 top-3 text-lg" aria-label="Osvojeno">✓</span>}
                <span
                  className={`grid size-14 place-items-center rounded-2xl border-2 text-3xl ${
                    earned
                      ? 'border-violet-500 bg-white shadow-[0_4px_0_#8b5cf6]'
                      : 'border-cloud-200 bg-cloud-100 opacity-55'
                  }`}
                  aria-hidden="true"
                >
                  {achievement.icon}
                </span>
                <h3 className={`mt-5 text-lg font-black ${earned ? 'text-ink-950' : 'text-ink-400'}`}>
                  {achievement.labelHr}
                </h3>
                <p className={`mt-1 text-sm font-bold leading-6 ${earned ? 'text-ink-600' : 'text-ink-400'}`}>
                  {achievement.description}
                </p>
                <p className={`mt-3 text-xs font-black uppercase tracking-[0.12em] ${earned ? 'text-violet-700' : 'text-ink-400'}`}>
                  {earned ? 'Osvojeno' : 'Zaključano'}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="scores-heading">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">
            Osobni rekordi
          </p>
          <h2 id="scores-heading" className="mt-1 text-2xl font-black text-ink-950">
            Score Strike
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {scoreStrikeTopics.map((topic) => {
            const progress = state.scoreStrike[topic.id];
            const bestScore = progress?.bestScore ?? 0;
            const playCount = progress?.playCount ?? 0;
            const meta =
              topic.id === 'mixed'
                ? {
                    icon: '🏆',
                    scoreSurface: 'border-amber-300 bg-amber-100',
                  }
                : TOPIC_META[topic.id] ?? FALLBACK_META;

            return (
              <Link
                key={topic.id}
                to={`/score-strike/${topic.id}`}
                className={`group rounded-3xl border-2 p-5 shadow-[0_4px_0_rgba(23,32,42,0.12)] transition hover:-translate-y-1 hover:shadow-[0_7px_0_rgba(23,32,42,0.12)] active:translate-y-0 ${meta.scoreSurface}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-black text-ink-950" aria-hidden="true">
                    {meta.icon}
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-ink-600">
                    {playCount} rundi
                  </span>
                </div>
                <h3 className="mt-5 font-black text-ink-950">{topic.label}</h3>
                <p className="mt-1 text-3xl font-black tabular-nums text-ink-950">
                  {bestScore.toLocaleString('hr-HR')}
                </p>
                <p className="mt-3 text-sm font-black text-ink-600 group-hover:text-ink-950">
                  Igraj ponovno →
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type StatCardTone = 'green' | 'cyan' | 'amber' | 'orange';

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone: StatCardTone;
};

const STAT_TONES: Record<StatCardTone, { card: string; icon: string }> = {
  green: {
    card: 'border-brand-200 bg-brand-50',
    icon: 'border-brand-700 bg-brand-200 text-brand-800 shadow-[0_3px_0_#1e7430]',
  },
  cyan: {
    card: 'border-cyan-200 bg-cyan-50',
    icon: 'border-cyan-700 bg-cyan-200 text-cyan-950 shadow-[0_3px_0_#0e7490]',
  },
  amber: {
    card: 'border-amber-200 bg-amber-50',
    icon: 'border-amber-700 bg-amber-200 text-amber-950 shadow-[0_3px_0_#b45309]',
  },
  orange: {
    card: 'border-orange-200 bg-orange-50',
    icon: 'border-orange-800 bg-orange-200 text-orange-950 shadow-[0_3px_0_#9a3412]',
  },
};

function StatCard({ label, value, hint, icon, tone }: StatCardProps) {
  const colors = STAT_TONES[tone];

  return (
    <div
      className={`rounded-[1.65rem] border-2 p-5 shadow-[0_5px_0_rgba(23,32,42,0.10)] ${colors.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <dt className="text-sm font-black text-ink-600">{label}</dt>
          <dd className="mt-2 text-3xl font-black tabular-nums text-ink-950">{value}</dd>
          {hint && <dd className="mt-1 text-xs font-extrabold text-ink-600">{hint}</dd>}
        </div>
        <span
          className={`grid size-11 place-items-center rounded-2xl border-2 text-lg font-black ${colors.icon}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

export default StatsPage;
