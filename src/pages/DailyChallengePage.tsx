import { Link } from 'react-router-dom';
import { ComboBadge } from '../components/ComboBadge';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionBody } from '../components/QuestionBody';
import { QuestionCard } from '../components/QuestionCard';
import { ResultsSummary } from '../components/ResultsSummary';
import { Timer } from '../components/Timer';
import { correctAnswerText } from '../lib/questionKinds';
import { useDailyChallengeSession } from '../hooks/useDailyChallengeSession';
import { QuestionsLoadError } from '../components/QuestionsLoadError';

export function DailyChallengePage() {
  const session = useDailyChallengeSession();

  if (session.status === 'loading') {
    return (
      <div
        className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-11 w-11 animate-spin rounded-full border-4 border-violet-100 border-t-violet-500"
          aria-hidden="true"
        />
        <p className="font-bold text-slate-600">Pripremamo dnevni izazov…</p>
      </div>
    );
  }

  if (session.status === 'load-failed') {
    return <QuestionsLoadError onRetry={session.retry} />;
  }

  if (session.status === 'already-played') {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-violet-200 bg-white p-8 text-center shadow-[0_6px_0_#ddd6fe] sm:p-10">
        <p className="text-5xl" aria-hidden="true">
          📅
        </p>
        <h1 className="mt-4 text-3xl font-black text-ink-950">
          Današnji izazov je odigran!
        </h1>
        <p className="mt-3 font-medium leading-7 text-ink-600">
          Osvojio si <strong className="font-black text-violet-700">{session.lastScore.toLocaleString('hr-HR')}</strong> bodova.
          {session.bestScore > session.lastScore && (
            <> Tvoj rekord dnevnih izazova: <strong className="font-black">{session.bestScore.toLocaleString('hr-HR')}</strong>.</>
          )}
        </p>
        <p className="mt-2 text-sm font-bold text-ink-400">
          Novi izazov stiže sutra — ista pitanja dobivaju svi igrači.
        </p>
        <Link to="/" className="game-button game-button-primary mt-6 px-6 py-3">
          Natrag na teme
        </Link>
      </div>
    );
  }

  if (session.status === 'finished') {
    return (
      <div className="mx-auto max-w-2xl py-6 sm:py-12">
        <ResultsSummary
          variant="score"
          title="Dnevni izazov završen!"
          score={session.score}
          isNewBest={session.score >= session.bestScore && session.score > 0}
          xpEarned={Math.round(session.score / 20)}
          onRestart={() => {}}
          restartLabel=""
          homeHref="/"
        >
          <p className="text-slate-600">
            Vrati se sutra po novi izazov — svi igrači danas rješavaju ista pitanja.
          </p>
        </ResultsSummary>
      </div>
    );
  }

  const prepared = session.prepared;
  const displayQuestionNumber = Math.min(session.questionIndex + 1, session.totalQuestions);
  const answeredCorrectly = session.isAnswered && session.lastAnswerCorrect === true;
  const timedOut = session.isAnswered && session.lastAnswerCorrect === null;
  const correctAnswer = prepared && session.isAnswered ? correctAnswerText(prepared) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-[2rem] border-2 border-violet-300 bg-white shadow-[0_6px_0_#c4b5fd,0_16px_34px_rgba(23,32,42,0.07)]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-violet-200 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 text-sm font-black text-ink-600 transition hover:bg-white hover:text-violet-700"
            aria-label="Prekini dnevni izazov i vrati se na početnu"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-white text-base shadow-sm" aria-hidden="true">
              ←
            </span>
            <span className="hidden sm:inline">Izađi</span>
          </Link>
          <div className="min-w-0 text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-violet-700">
              Dnevni izazov · {session.todayISO}
            </p>
            <p className="truncate text-base font-black text-ink-950 sm:text-lg">
              Ista pitanja za sve igrače
            </p>
          </div>
          <ComboBadge combo={session.combo} />
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-[auto_1fr] sm:items-stretch sm:p-6">
          <div
            className="flex items-center justify-between gap-5 rounded-2xl border-2 border-violet-300 bg-violet-50 px-5 py-4 shadow-[0_3px_0_#c4b5fd] sm:min-w-44 sm:flex-col sm:items-start sm:justify-center sm:gap-1"
            role="status"
            aria-live="polite"
            aria-label={`${session.score} bodova`}
          >
            <span className="text-xs font-black uppercase tracking-wider text-violet-700">Bodovi</span>
            <span className="text-3xl font-black tabular-nums text-violet-900">
              {session.score.toLocaleString('hr-HR')}
            </span>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <Timer remainingMs={session.timeRemainingMs} totalMs={session.timeTotalMs} />
              <span className="shrink-0 text-sm font-extrabold text-ink-600">
                {displayQuestionNumber}/{session.totalQuestions}
              </span>
            </div>
            <ProgressBar
              value={session.questionIndex + (session.isAnswered ? 1 : 0)}
              max={session.totalQuestions}
              label="Napredak dnevnog izazova"
              showValue
            />
          </div>
        </div>
      </header>

      {prepared && (
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-violet-100/90 via-transparent to-fuchsia-100/70 blur-lg"
            aria-hidden="true"
          />
          <QuestionCard
            key={`daily-${session.questionIndex}`}
            eyebrow="Dnevni izazov"
            question={prepared.question.question}
          >
            <QuestionBody
              key={`daily-body-${session.questionIndex}`}
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
                  answeredCorrectly ? 'bg-emerald-500 text-white' : timedOut ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                }`}
                aria-hidden="true"
              >
                {answeredCorrectly ? '✓' : timedOut ? '⌛' : '×'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-black ${answeredCorrectly ? 'text-emerald-900' : timedOut ? 'text-amber-900' : 'text-rose-900'}`}>
                  {answeredCorrectly
                    ? 'Točno!'
                    : timedOut
                      ? 'Vrijeme je isteklo.'
                      : 'Netočno.'}
                </p>
                {correctAnswer && !answeredCorrectly && (
                  <p className="mt-1 text-sm font-semibold leading-6 text-ink-800">
                    <span className="font-black">Točan odgovor:</span> {correctAnswer}
                  </p>
                )}
                {session.explanation && (
                  <p className="mt-1 text-sm font-medium leading-6 text-ink-600">{session.explanation}</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default DailyChallengePage;
