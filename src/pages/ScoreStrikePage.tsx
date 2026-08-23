import { Link, useParams } from 'react-router-dom';
import { ComboBadge } from '../components/ComboBadge';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionBody } from '../components/QuestionBody';
import { QuestionCard } from '../components/QuestionCard';
import { ResultsSummary } from '../components/ResultsSummary';
import { Timer } from '../components/Timer';
import { TOPICS } from '../data/topics';
import { QuestionsLoadError } from '../components/QuestionsLoadError';
import { correctAnswerText } from '../lib/questionKinds';
import { useScoreStrikeSession } from '../hooks/useScoreStrikeSession';

type ScoreStrikeSessionProps = {
  topicId: string;
  topicLabel: string;
};

function ScoreStrikeSession({
  topicId,
  topicLabel,
}: ScoreStrikeSessionProps) {
  const session = useScoreStrikeSession(topicId);

  if (session.status === 'loading') {
    return (
      <div
        className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-11 w-11 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500"
          aria-hidden="true"
        />
        <p className="font-bold text-slate-600">Pripremamo Score Strike…</p>
      </div>
    );
  }

  if (session.status === 'load-failed') {
    return <QuestionsLoadError onRetry={session.restart} />;
  }

  if (session.status === 'finished') {
    return (
      <div className="mx-auto max-w-2xl py-6 sm:py-12">
        <ResultsSummary
          variant="score"
          title="Score Strike runda je završena!"
          score={session.score}
          isNewBest={session.isNewBest}
          xpEarned={Math.round(session.score / 20)}
          onRestart={session.restart}
          restartLabel="Igraj ponovno"
          homeHref="/"
        >
          <p className="text-slate-600">
            {session.isNewBest
              ? `Novi osobni rekord za ${topicLabel}!`
              : `Još jedan odigrani izazov za temu ${topicLabel}.`}
          </p>
        </ResultsSummary>
      </div>
    );
  }

  const prepared = session.prepared;
  const displayQuestionNumber = Math.min(
    session.questionIndex + 1,
    session.totalQuestions,
  );
  const answeredCorrectly = session.isAnswered && session.lastAnswerCorrect === true;
  const timedOut = session.isAnswered && session.lastAnswerCorrect === null;
  const correctAnswer =
    prepared && session.isAnswered ? correctAnswerText(prepared) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-[2rem] border-2 border-amber-300 bg-white shadow-[0_6px_0_#fcd34d,0_16px_34px_rgba(23,32,42,0.07)]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 via-white to-orange-50 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 text-sm font-black text-ink-600 transition hover:bg-white hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            aria-label="Prekini Score Strike i vrati se na početnu"
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
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-amber-700">
              Brzinski izazov
            </p>
            <p className="truncate text-base font-black text-ink-950 sm:text-lg">
              Score Strike · {topicLabel}
            </p>
          </div>

          <ComboBadge combo={session.combo} />
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-[auto_1fr] sm:items-stretch sm:p-6">
          <div
            className="flex items-center justify-between gap-5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 shadow-[0_3px_0_#fcd34d] sm:min-w-44 sm:flex-col sm:items-start sm:justify-center sm:gap-1"
            role="status"
            aria-live="polite"
            aria-label={`${session.score} bodova`}
          >
            <div>
              <span className="block text-[0.65rem] font-black uppercase tracking-[0.18em] text-amber-700">
                Rezultat
              </span>
              <span className="mt-1 block text-4xl font-black tabular-nums tracking-tight text-amber-800">
                {session.score.toLocaleString('hr-HR')}
              </span>
            </div>
            <div
              className="rounded-xl bg-white/80 px-3 py-2 text-right sm:w-full sm:text-left"
              aria-label={`Pitanje ${displayQuestionNumber} od ${session.totalQuestions}`}
            >
              <span className="block text-[0.6rem] font-black uppercase tracking-wider text-ink-600">
                Pitanje
              </span>
              <span className="text-sm font-black tabular-nums text-ink-800">
                {displayQuestionNumber} / {session.totalQuestions}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-5">
            <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-4 shadow-[0_3px_0_#bae6fd]">
              <Timer
                remainingMs={session.timeRemainingMs}
                totalMs={session.timeTotalMs}
              />
              <p className="mt-3 text-xs font-bold text-ink-600">
                Brži odgovor donosi više bodova. Ne dopusti da timer dođe do
                nule!
              </p>
            </div>
            <ProgressBar
              value={session.questionIndex + (session.isAnswered ? 1 : 0)}
              max={session.totalQuestions}
              label="Napredak izazova"
              showValue
            />
          </div>
        </div>
      </header>

      {prepared && (
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-100/90 via-transparent to-orange-100/70 blur-lg"
            aria-hidden="true"
          />
          <QuestionCard
            key={`${topicId}-${session.questionIndex}`}
            eyebrow={`Odgovori brzo · ${topicLabel}`}
            question={prepared.question.question}
          >
            <QuestionBody
              key={`body-${topicId}-${session.questionIndex}`}
              prepared={prepared}
              isAnswered={session.isAnswered}
              onAnswer={session.answerQuestion}
              questionNumber={displayQuestionNumber}
            />
          </QuestionCard>
        </div>
      )}

      <div className="min-h-24" aria-live="assertive" aria-atomic="true">
        {session.isAnswered && (
          <section
            className={`${
              answeredCorrectly
                ? 'session-correct border-emerald-200 bg-emerald-50'
                : timedOut
                  ? 'session-incorrect border-amber-200 bg-amber-50'
                  : 'session-incorrect border-rose-200 bg-rose-50'
            } overflow-hidden rounded-3xl border-2 shadow-[0_5px_0_rgba(23,32,42,0.12)]`}
            aria-label="Povratna informacija o odgovoru"
          >
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-2xl text-xl font-black shadow-sm ${
                  answeredCorrectly
                    ? 'bg-emerald-500 text-white'
                    : timedOut
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-rose-500 text-white'
                }`}
                aria-hidden="true"
              >
                {answeredCorrectly ? '⚡' : timedOut ? '⌛' : '×'}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-lg font-black ${
                    answeredCorrectly
                      ? 'text-emerald-900'
                      : timedOut
                        ? 'text-amber-900'
                        : 'text-rose-900'
                  }`}
                >
                  {answeredCorrectly
                    ? 'Brzo i točno — combo raste!'
                    : timedOut
                      ? 'Vrijeme je isteklo — sljedeće pitanje stiže!'
                      : 'Combo se resetira — idemo dalje!'}
                </p>
                {correctAnswer && (
                  <p className="mt-1 text-sm font-semibold leading-5 text-ink-800">
                    <span className="font-black">Točan odgovor:</span>{' '}
                    {correctAnswer}
                  </p>
                )}
                {session.explanation && (
                  <p className="mt-1 text-xs font-medium leading-5 text-ink-600">
                    {session.explanation}
                  </p>
                )}
              </div>

              <span
                className="hidden shrink-0 self-center text-xs font-black uppercase tracking-wider text-ink-600 sm:block"
                aria-hidden="true"
              >
                Sljedeće →
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export function ScoreStrikePage() {
  const { topicId = '' } = useParams();
  const topic = TOPICS.find((candidate) => candidate.id === topicId);
  const isMixed = topicId === 'mixed';

  if (!topic && !isMixed) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-rose-200 bg-white p-8 text-center shadow-[0_6px_0_#fecdd3] sm:p-10">
        <p className="text-5xl" aria-hidden="true">
          ⏱️
        </p>
        <h1 className="mt-4 text-3xl font-black text-slate-900">
          Izazov nije pronađen
        </h1>
        <p className="mt-3 font-medium leading-7 text-slate-600">
          Odaberi postojeću temu ili pokreni mješoviti Score Strike.
        </p>
        <Link
          to="/"
          className="game-button game-button-boss mt-6 px-6 py-3"
        >
          Povratak na teme
        </Link>
      </div>
    );
  }

  return (
    <ScoreStrikeSession
      topicId={topicId}
      topicLabel={isMixed ? 'Sve teme' : topic?.labelHr ?? topicId}
    />
  );
}

export default ScoreStrikePage;
