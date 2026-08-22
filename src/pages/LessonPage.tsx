import { Link, useParams } from 'react-router-dom';
import { HeartsDisplay } from '../components/HeartsDisplay';
import { HeartsGate } from '../components/HeartsGate';
import { OptionButton } from '../components/OptionButton';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { ResultsSummary } from '../components/ResultsSummary';
import { TOPICS } from '../data/topics';
import { getUnit } from '../data/units';
import { useLessonSession } from '../hooks/useLessonSession';

type LessonSessionProps = {
  topicId: string;
  topicLabel: string;
  unitId?: string;
  /** Kamo vodi "Izađi" - put cjeline vodi natrag na svoju temu, ne na početnu. */
  exitHref: string;
};

function LessonSession({ topicId, topicLabel, unitId, exitHref }: LessonSessionProps) {
  const session = useLessonSession(topicId, unitId);

  if (session.status === 'loading') {
    return <SessionLoading label="Pripremamo tvoju lekciju…" />;
  }

  if (session.status === 'no-hearts') {
    return (
      <div className="py-6 sm:py-12">
        <HeartsGate scoreStrikeHref={`/score-strike/${topicId}`} />
      </div>
    );
  }

  if (session.status === 'passed' || session.status === 'failed') {
    const passed = session.status === 'passed';

    return (
      <div className="mx-auto max-w-2xl py-6 sm:py-12">
        <ResultsSummary
          variant={passed ? 'passed' : 'failed'}
          title={passed ? 'Lekcija završena!' : 'Ponestalo ti je srca'}
          correctCount={session.correctCount}
          totalCount={session.totalQuestions}
          xpEarned={passed ? session.correctCount * 10 : 0}
          onRestart={session.restart}
          restartLabel={passed ? 'Vježbaj ponovno' : 'Pokušaj ponovno'}
          homeHref={exitHref}
        >
          <p className="text-slate-600">
            {passed
              ? `Odlično! Uspješno si prošao temu ${topicLabel}.`
              : 'Nema odustajanja — svaki pokušaj učvršćuje znanje.'}
          </p>
        </ResultsSummary>
      </div>
    );
  }

  const question = session.currentQuestion;
  const displayQuestionNumber = Math.min(
    session.questionIndex + 1,
    session.totalQuestions,
  );
  const correctAnswer =
    question && session.correctOptionIndex !== null
      ? question.options[session.correctOptionIndex]
      : null;
  const answeredCorrectly =
    session.isAnswered &&
    session.selectedOptionIndex === session.correctOptionIndex;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-[2rem] border-2 border-brand-200 bg-white shadow-[0_6px_0_#b8efc1,0_16px_34px_rgba(23,32,42,0.07)]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-cloud-200 bg-gradient-to-r from-brand-50 via-white to-amber-50 px-4 py-3 sm:px-6">
          <Link
            to={exitHref}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 text-sm font-black text-ink-600 transition hover:bg-white hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            aria-label="Prekini lekciju i vrati se natrag"
          >
            <span
              className="grid size-7 place-items-center rounded-lg bg-white text-base shadow-sm"
              aria-hidden="true"
            >
              ←
            </span>
            <span className="hidden sm:inline">Izađi</span>
          </Link>
          <div className="min-w-0 text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-brand-700">
              Lekcija
            </p>
            <p className="truncate text-base font-black text-ink-950 sm:text-lg">
              {topicLabel}
            </p>
          </div>
          <HeartsDisplay hearts={session.hearts} maxHearts={5} />
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
          <div
            className="flex items-baseline justify-center gap-1 rounded-2xl border-2 border-brand-200 bg-brand-50 px-5 py-3 text-brand-700 shadow-[0_3px_0_#b8efc1] sm:min-w-28 sm:flex-col sm:items-center sm:gap-0"
            aria-label={`Pitanje ${displayQuestionNumber} od ${session.totalQuestions}`}
          >
            <span className="text-3xl font-black tabular-nums">
              {displayQuestionNumber}
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-brand-600">
              od {session.totalQuestions}
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ink-600">
                  Misija u tijeku
                </p>
                <p className="mt-1 font-black text-ink-950">
                  Dođi do cilja sa srcima na broju
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold text-ink-600 sm:hidden">
                {session.correctCount} točno
              </span>
            </div>
            <ProgressBar
              value={session.questionIndex + (session.isAnswered ? 1 : 0)}
              max={session.totalQuestions}
              label="Napredak lekcije"
              showValue
            />
          </div>

          <div
            className="hidden min-w-24 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-center shadow-[0_3px_0_#a7f3d0] sm:block"
            role="status"
            aria-label={`${session.correctCount} točnih odgovora`}
          >
            <span className="block text-xs font-black uppercase tracking-wider text-emerald-700">
              Točno
            </span>
            <span className="mt-1 block text-2xl font-black tabular-nums text-emerald-700">
              {session.correctCount}
            </span>
          </div>
        </div>
      </header>

      {question ? (
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100/80 via-transparent to-cyan-100/70 blur-lg"
            aria-hidden="true"
          />
          <QuestionCard
            key={`${topicId}-${session.questionIndex}`}
            eyebrow={`Odaberi jedan odgovor · ${topicLabel}`}
            question={question.question}
          >
            <div
              className="grid gap-3"
              role="group"
              aria-label={`Ponuđeni odgovori za pitanje ${displayQuestionNumber}`}
            >
              {question.options.map((option, index) => {
                let optionState:
                  | 'idle'
                  | 'selected'
                  | 'correct'
                  | 'incorrect'
                  | 'disabled' = 'idle';

                if (session.isAnswered) {
                  if (index === session.correctOptionIndex) {
                    optionState = 'correct';
                  } else if (index === session.selectedOptionIndex) {
                    optionState = 'incorrect';
                  } else {
                    optionState = 'disabled';
                  }
                }

                return (
                  <OptionButton
                    key={`${index}-${option}`}
                    index={index}
                    state={optionState}
                    disabled={session.isAnswered}
                    onClick={() => session.answerQuestion(index)}
                  >
                    {option}
                  </OptionButton>
                );
              })}
            </div>
          </QuestionCard>
        </div>
      ) : (
        <SessionLoading label="Učitavamo sljedeće pitanje…" />
      )}

      <div className="min-h-24" aria-live="polite" aria-atomic="true">
        {session.isAnswered && (
          <section
            className={`${
              answeredCorrectly
                ? 'session-correct border-emerald-200 bg-emerald-50'
                : 'session-incorrect border-rose-200 bg-rose-50'
            } overflow-hidden rounded-3xl border-2 shadow-[0_5px_0_rgba(23,32,42,0.12)]`}
            aria-label="Povratna informacija o odgovoru"
          >
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl font-black shadow-sm ${
                  answeredCorrectly
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
                aria-hidden="true"
              >
                {answeredCorrectly ? '✓' : '×'}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xl font-black ${
                    answeredCorrectly ? 'text-emerald-900' : 'text-rose-900'
                  }`}
                >
                  {answeredCorrectly
                    ? 'Odlično — odgovor je točan!'
                    : 'Dobar pokušaj — ovo vrijedi zapamtiti.'}
                </p>
                {correctAnswer && (
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink-800">
                    <span className="font-black">Točan odgovor:</span>{' '}
                    {correctAnswer}
                  </p>
                )}
                {session.explanation && (
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-600">
                    <span className="font-black text-ink-800">Zašto?</span>{' '}
                    {session.explanation}
                  </p>
                )}
                {!answeredCorrectly && (
                  <p className="mt-2 text-xs font-bold text-rose-700">
                    Izgubio si jedno srce, ali znanje ostaje.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={session.nextQuestion}
                className={`min-h-12 shrink-0 rounded-2xl border-2 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 active:translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 ${
                  answeredCorrectly
                    ? 'border-emerald-800 bg-emerald-600 shadow-[0_4px_0_#065f46] hover:bg-emerald-700 active:shadow-[0_1px_0_#065f46] focus-visible:outline-emerald-800'
                    : 'border-rose-800 bg-rose-600 shadow-[0_4px_0_#9f1239] hover:bg-rose-700 active:shadow-[0_1px_0_#9f1239] focus-visible:outline-rose-800'
                }`}
              >
                {session.questionIndex + 1 >= session.totalQuestions
                  ? 'Prikaži rezultat'
                  : 'Nastavi'}
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SessionLoading({ label }: { label: string }) {
  return (
    <div
      className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-4 text-center"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-11 w-11 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"
        aria-hidden="true"
      />
      <p className="font-bold text-slate-600">{label}</p>
    </div>
  );
}

export function LessonPage() {
  const { topicId = '', unitId } = useParams();
  const topic = TOPICS.find((candidate) => candidate.id === topicId);
  const unit = topic && unitId ? getUnit(topic.id, unitId) : undefined;

  if (!topic || (unitId && !unit)) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-rose-200 bg-white p-8 text-center shadow-[0_6px_0_#fecdd3] sm:p-10">
        <p className="text-5xl" aria-hidden="true">
          🧭
        </p>
        <h1 className="mt-4 text-3xl font-black text-slate-900">
          Tema nije pronađena
        </h1>
        <p className="mt-3 font-medium leading-7 text-slate-600">
          Ova lekcija ne postoji. Odaberi jednu od dostupnih tema na
          početnoj stranici.
        </p>
        <Link
          to="/"
          className="game-button game-button-primary mt-6 px-6 py-3"
        >
          Pogledaj teme
        </Link>
      </div>
    );
  }

  return (
    <LessonSession
      topicId={topic.id}
      topicLabel={unit ? `${topic.labelHr} · ${unit.labelHr}` : topic.labelHr}
      unitId={unit?.id}
      exitHref={unit ? `/topic/${topic.id}` : '/'}
    />
  );
}

export default LessonPage;
