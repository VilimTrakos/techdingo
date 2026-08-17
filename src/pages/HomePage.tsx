import { Link } from 'react-router-dom';
import { TopicCard } from '../components/TopicCard';
import { TOPICS } from '../data/topics';
import { useProgress } from '../hooks/useProgress';

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  sql: 'Upiti, relacije, indeksi i sve što čini dobru bazu podataka.',
  frontend: 'JavaScript, preglednik, React, CSS i moderno web sučelje.',
  backend: 'API-ji, arhitektura, sigurnost i skaliranje sustava.',
};

export function HomePage() {
  const { state } = useProgress();
  const totalQuestions = TOPICS.reduce(
    (total, topic) => total + topic.questions.length,
    0,
  );

  return (
    <div className="space-y-10 pb-8 sm:space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-6 py-10 text-white shadow-xl shadow-indigo-200/60 sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-amber-300/20 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative max-w-3xl">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-amber-200">
            Učenje koje drži tempo
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Izbrusi znanje za sljedeći tehnički intervju.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-indigo-50 sm:text-lg">
            Vježbaj po temama u lekcijama sa srcima ili odmjeri brzinu u
            Score Strike izazovu. Svaki dovršeni krug gradi tvoj niz i XP.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#teme"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-indigo-700 shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Odaberi temu
            </a>
            <Link
              to="/score-strike/mixed"
              className="rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Pokreni mješoviti izazov
            </Link>
          </div>
        </div>
      </section>

      <section id="teme" aria-labelledby="topics-heading" className="scroll-mt-24">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
              Tvoj trening
            </p>
            <h2
              id="topics-heading"
              className="mt-1 text-3xl font-black tracking-tight text-slate-900"
            >
              Odaberi područje
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {totalQuestions} pitanja u {TOPICS.length} teme
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TOPICS.map((topic) => (
            <TopicCard
              key={topic.id}
              id={topic.id}
              title={topic.labelHr}
              description={
                TOPIC_DESCRIPTIONS[topic.id] ??
                'Provjeri znanje i učvrsti najvažnije koncepte.'
              }
              accent={topic.id}
              questionCount={topic.questions.length}
              lessonHref={`/lesson/${topic.id}`}
              scoreStrikeHref={`/score-strike/${topic.id}`}
              bestScore={state.scoreStrike[topic.id]?.bestScore ?? 0}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="mixed-heading"
        className="grid gap-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
            Završni test
          </p>
          <h2
            id="mixed-heading"
            className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl"
          >
            Score Strike: sve teme
          </h2>
          <p className="mt-3 max-w-2xl font-medium leading-7 text-slate-600">
            SQL, Frontend i Backend u jednoj brzoj rundi. Odgovaraj brzo,
            gradi combo i pokušaj srušiti osobni rekord.
          </p>
          <p className="mt-4 text-sm font-bold text-amber-800">
            Osobni rekord: {state.scoreStrike.mixed?.bestScore ?? 0} bodova
          </p>
        </div>
        <Link
          to="/score-strike/mixed"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-500 px-6 py-3 font-black text-slate-950 shadow-md shadow-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
        >
          Započni izazov
        </Link>
      </section>
    </div>
  );
}

export default HomePage;
