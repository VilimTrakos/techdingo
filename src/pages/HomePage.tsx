import { Link } from 'react-router-dom';
import { TOPICS } from '../data/topics';
import { getUnitsForTopic, unitProgressKey } from '../data/units';
import { useProgress } from '../hooks/useProgress';
import { toLocalDateISO } from '../state/streak';

const TOPIC_META: Record<
  string,
  { description: string; icon: string; accent: string; iconSurface: string; progress: string }
> = {
  sql: {
    description: 'Od prvog SELECT-a do pametnih indeksa i brzih upita.',
    icon: '▤',
    accent: 'border-cyan-200 bg-cyan-50/70 hover:border-cyan-400',
    iconSurface: 'bg-cyan-100 text-cyan-900',
    progress: 'bg-cyan-400',
  },
  frontend: {
    description: 'JavaScript, React, CSS i sve što korisnik vidi i dodiruje.',
    icon: '</>',
    accent: 'border-amber-200 bg-amber-50/75 hover:border-amber-400',
    iconSurface: 'bg-amber-100 text-amber-900',
    progress: 'bg-amber-400',
  },
  backend: {
    description: 'API-ji, sigurnost, arhitektura i skaliranje sustava.',
    icon: '⚙',
    accent: 'border-orange-200 bg-orange-50/75 hover:border-orange-400',
    iconSurface: 'bg-orange-100 text-orange-950',
    progress: 'bg-orange-500',
  },
  general: {
    description: 'Strukture podataka, Big-O, SOLID, Git i testiranje.',
    icon: '✦',
    accent: 'border-brand-200 bg-brand-50/75 hover:border-brand-400',
    iconSurface: 'bg-brand-100 text-brand-800',
    progress: 'bg-brand-500',
  },
};

export function HomePage() {
  const { state } = useProgress();
  const totalQuestions = TOPICS.reduce(
    (total, topic) => total + topic.questions.length,
    0,
  );

  // Napredak po temi = broj prođenih cjelina (unit lekcija) unutar te teme.
  const topicCards = TOPICS.map((topic) => {
    const units = getUnitsForTopic(topic.id);
    const unitsCompleted = units.filter(
      (unit) => (state.lessons[unitProgressKey(topic.id, unit.id)]?.passCount ?? 0) > 0,
    ).length;
    const meta = TOPIC_META[topic.id] ?? TOPIC_META.sql;
    return {
      topic,
      meta,
      unitsCompleted,
      unitsTotal: units.length,
      bestScore: state.scoreStrike[topic.id]?.bestScore ?? 0,
    };
  });

  const completedLessons = topicCards.reduce((total, card) => total + card.unitsCompleted, 0);
  const currentCard = topicCards.find((card) => card.unitsCompleted < card.unitsTotal) ?? null;
  const primaryHref = currentCard ? `/topic/${currentCard.topic.id}` : '/score-strike/mixed';
  const primaryLabel = currentCard
    ? `Nastavi: ${currentCard.topic.labelHr}`
    : 'Pokreni završni izazov';
  const guideMarkSrc = `${import.meta.env.BASE_URL}tech-hedgehog.webp`;
  const dailyPlayedToday = state.dailyChallenge.lastPlayedDateISO === toLocalDateISO();

  return (
    <div className="space-y-14 pb-10 sm:space-y-20">
      <section className="hero-stage relative isolate overflow-hidden rounded-[2rem] border-2 border-[#e8ddaa] bg-[#fff9df] px-5 pb-0 pt-8 shadow-[0_7px_0_#d8cd9f,0_20px_50px_rgba(54,72,42,0.10)] sm:rounded-[2.5rem] sm:px-10 sm:pt-11 lg:grid lg:min-h-[31rem] lg:grid-cols-[minmax(0,1.1fr)_minmax(17rem,0.9fr)] lg:items-center lg:gap-4 lg:px-12 lg:py-12">
        <div
          aria-hidden="true"
          className="absolute -left-16 -top-24 -z-10 size-72 rounded-full bg-brand-100/80 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-4rem] top-[-5rem] -z-10 size-64 rounded-full bg-amber-200/60 blur-2xl"
        />

        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-brand-200 bg-white/85 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-brand-700 shadow-sm sm:text-sm">
            <span aria-hidden="true">⚡</span> Tvoj put do boljeg intervjua
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.65rem] font-black leading-[0.98] tracking-[-0.04em] text-ink-950 sm:text-6xl lg:text-[4.25rem]">
            Uči. Osvoji XP.
            <span className="mt-2 block text-brand-600">Rasturi intervju.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base font-bold leading-7 text-ink-600 sm:text-lg">
            Kratke lekcije rastu od lakih prema težim pitanjima. Čuvaj srca,
            gradi niz i otključaj svoj najbolji rezultat.
          </p>

          <div className="mt-7 flex flex-col gap-3 min-[440px]:flex-row">
            <Link to={primaryHref} className="game-button game-button-primary px-6 py-3.5">
              <span aria-hidden="true">▶</span> {primaryLabel}
            </Link>
            <a href="#put-ucenja" className="game-button game-button-ghost px-6 py-3.5">
              Pogledaj put
            </a>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
            <div className="game-stat">
              <dt>
                <span aria-hidden="true">✦</span> XP
              </dt>
              <dd>{state.xpTotal.toLocaleString('hr-HR')}</dd>
            </div>
            <div className="game-stat">
              <dt>
                <span aria-hidden="true">🔥</span> Niz
              </dt>
              <dd>{state.streak.current} dana</dd>
            </div>
            <div className="game-stat">
              <dt>
                <span aria-hidden="true">🏁</span> Prolazi
              </dt>
              <dd>{completedLessons}</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto mt-8 grid h-[18rem] w-full max-w-[25rem] place-items-center self-end sm:h-[22rem] lg:mt-0 lg:h-[26rem]">
          <div
            aria-hidden="true"
            className="absolute size-[15.5rem] rounded-[4rem] border-[3px] border-dashed border-brand-300 bg-brand-100/70 sm:size-[19rem] lg:size-[21rem]"
          />
          <div className="guide-emblem relative z-10 grid size-[13.5rem] place-items-center rounded-[3.25rem] border-[3px] border-ink-950 bg-white/90 shadow-[0_8px_0_#17202a,0_18px_45px_rgba(23,32,42,0.14)] sm:size-[16.5rem] lg:size-[18rem]">
            <img
              src={guideMarkSrc}
              alt=""
              aria-hidden="true"
              className="size-[88%] object-contain"
            />
          </div>
          <span className="absolute left-0 top-6 z-20 rotate-[-5deg] rounded-xl border-2 border-cyan-700 bg-cyan-100 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-950 shadow-[0_3px_0_#0e7490] sm:left-1 sm:top-12">
            Lako → teško
          </span>
          <span className="absolute bottom-5 right-0 z-20 rotate-3 rounded-xl border-2 border-amber-700 bg-amber-200 px-3 py-2 text-sm font-black text-amber-950 shadow-[0_3px_0_#b45309] sm:bottom-10 sm:right-1">
            + XP
          </span>
          <span
            className="sparkle sparkle-one absolute left-[5%] top-[48%] text-3xl"
            aria-hidden="true"
          >
            ✦
          </span>
          <span
            className="sparkle sparkle-two absolute right-[4%] top-[23%] text-2xl"
            aria-hidden="true"
          >
            ✦
          </span>
        </div>
      </section>

      <section aria-labelledby="daily-heading" className="mx-auto max-w-4xl">
        <Link
          to="/daily"
          className={`flex flex-col items-center gap-4 rounded-[2rem] border-2 p-6 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:text-left ${
            dailyPlayedToday
              ? 'border-cloud-200 bg-cloud-50'
              : 'border-violet-300 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50'
          }`}
        >
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-2xl text-2xl ${
              dailyPlayedToday ? 'bg-cloud-100' : 'bg-violet-100'
            }`}
            aria-hidden="true"
          >
            {dailyPlayedToday ? '✅' : '📅'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="daily-heading" className="text-xl font-black tracking-tight text-ink-950 sm:text-2xl">
              Dnevni izazov
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink-600">
              {dailyPlayedToday
                ? `Danas riješeno: ${state.dailyChallenge.lastScore.toLocaleString('hr-HR')} bodova. Novi izazov stiže sutra!`
                : '10 pitanja iz svih tema, ista za sve igrače. Jednom dnevno — ne troši srca.'}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider ${
              dailyPlayedToday ? 'bg-cloud-100 text-ink-400' : 'bg-violet-600 text-white'
            }`}
          >
            {dailyPlayedToday ? 'Riješeno' : 'Igraj sad'}
          </span>
        </Link>
      </section>

      <section
        id="put-ucenja"
        aria-labelledby="path-heading"
        className="scroll-mt-28"
      >
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-700">
            Karta napretka
          </p>
          <h2
            id="path-heading"
            className="mt-2 text-3xl font-black tracking-tight text-ink-950 sm:text-4xl"
          >
            Odaberi svoje područje
          </h2>
          <p className="mt-3 font-bold leading-7 text-ink-600">
            Svaka tema ima vlastiti put učenja: cjeline od osnova do naprednog,
            otključavaju se redom kako napreduješ.
          </p>
          <p className="mt-3 text-sm font-extrabold text-brand-700">
            {totalQuestions} pitanja · {TOPICS.length} područja
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {topicCards.map(({ topic, meta, unitsCompleted, unitsTotal, bestScore }) => {
            const progressPct = unitsTotal > 0 ? Math.round((unitsCompleted / unitsTotal) * 100) : 0;
            return (
              <Link
                key={topic.id}
                to={`/topic/${topic.id}`}
                className={`group relative block rounded-3xl border-2 p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lg ${meta.accent}`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-black ${meta.iconSurface}`}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black tracking-tight text-ink-950">
                      {topic.labelHr}
                    </h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-ink-600">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-extrabold text-ink-600">
                    <span>
                      {unitsCompleted}/{unitsTotal} cjelina
                    </span>
                    <span>{topic.questions.length} pitanja</span>
                  </div>
                  <div
                    className="mt-2 h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-inset ring-ink-400/15"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Napredak teme ${topic.labelHr}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${meta.progress}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  {bestScore > 0 ? (
                    <span className="text-xs font-extrabold text-ink-600">
                      <span aria-hidden="true">🏆</span> {bestScore.toLocaleString('hr-HR')} bodova
                    </span>
                  ) : (
                    <span className="text-xs font-extrabold text-ink-400">
                      Još nema rekorda
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-black text-brand-700 transition group-hover:translate-x-0.5">
                    Otvori put <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <section
          aria-labelledby="boss-heading"
          className="boss-stage relative mx-auto mt-12 max-w-3xl overflow-visible rounded-[2rem] border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 text-center shadow-[0_7px_0_#d69e18,0_18px_40px_rgba(120,74,16,0.12)] sm:p-9"
        >
          <div
            className="boss-node mx-auto -mt-16 grid size-24 place-items-center rounded-[2rem] border-[5px] border-amber-700 bg-amber-400 text-4xl shadow-[0_7px_0_#a16207]"
            aria-hidden="true"
          >
            🏆
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-amber-800">
            Boss razina · sve teme
          </p>
          <h2 id="boss-heading" className="mt-2 text-3xl font-black text-ink-950">
            Score Strike finale
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-semibold leading-7 text-ink-600">
            SQL, Frontend, Backend i Opće u jednoj brzoj rundi. Složi combo,
            pobijedi sat i postavi novi osobni rekord.
          </p>
          <p className="mt-4 text-sm font-black text-amber-900">
            Tvoj rekord: {(state.scoreStrike.mixed?.bestScore ?? 0).toLocaleString('hr-HR')} bodova
          </p>
          <Link
            to="/score-strike/mixed"
            className="game-button game-button-boss mx-auto mt-6 max-w-xs px-7 py-3.5"
          >
            <span aria-hidden="true">⚡</span> Pokreni finale
          </Link>
        </section>
      </section>
    </div>
  );
}

export default HomePage;
