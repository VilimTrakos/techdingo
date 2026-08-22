import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionBody } from '../components/QuestionBody';
import { QuestionCard } from '../components/QuestionCard';
import { correctAnswerText } from '../lib/questionKinds';
import { useReviewSession } from '../hooks/useReviewSession';

export function ReviewPage() {
  const session = useReviewSession();

  if (session.status === 'loading') {
    return (
      <div
        className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-11 w-11 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500"
          aria-hidden="true"
        />
        <p className="font-bold text-ink-600">Skupljamo tvoje greške…</p>
      </div>
    );
  }

  if (session.status === 'empty') {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-brand-200 bg-white p-8 text-center shadow-[0_6px_0_#b8efc1] sm:p-10">
        <p className="text-6xl" aria-hidden="true">🎉</p>
        <h1 className="mt-4 text-3xl font-black text-ink-950">Nemaš grešaka za ponoviti!</h1>
        <p className="mt-3 font-medium leading-7 text-ink-600">
          Sve što si dosad promašio, ispravio si. Odigraj još koju lekciju —
          pitanja koja pogriješiš skupljaju se ovdje i čekaju te na ponavljanje.
        </p>
        <Link to="/" className="game-button game-button-primary mt-6 px-6 py-3">
          Natrag na teme
        </Link>
      </div>
    );
  }

  if (session.status === 'finished') {
    const allCleared = session.remainingAfterSession === 0;
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border-2 border-brand-200 bg-white p-8 text-center shadow-[0_6px_0_#b8efc1] sm:p-10">
        <p className="text-6xl" aria-hidden="true">{allCleared ? '🏆' : '💪'}</p>
        <h1 className="mt-4 text-3xl font-black text-ink-950">Ponavljanje završeno!</h1>
        <p className="mt-3 font-medium leading-7 text-ink-600">
          Ispravio si <strong className="font-black text-brand-700">{session.correctCount}</strong>{' '}
          {session.correctCount === 1 ? 'pitanje' : 'pitanja'} i time ih maknuo s popisa.
          {session.stillWrongCount > 0 && (
            <> Još <strong className="font-black">{session.stillWrongCount}</strong> treba još malo vježbe.</>
          )}
        </p>
        <p className="mt-2 text-sm font-bold text-ink-400">
          {allCleared
            ? 'Popis grešaka je prazan — svaka čast!'
            : `Preostalo za ponavljanje: ${session.remainingAfterSession}`}
        </p>
        <p className="mt-4 font-black text-brand-700">+{session.correctCount * 10} XP</p>

        <div className="mt-6 grid gap-3">
          {!allCleared && (
            <button type="button" onClick={session.restart} className="game-button game-button-primary px-6 py-3">
              Ponovi ponovno
            </button>
          )}
          <Link to="/" className="game-button game-button-secondary px-6 py-3">
            Natrag na teme
          </Link>
        </div>
      </div>
    );
  }

  const prepared = session.prepared;
  const displayQuestionNumber = Math.min(session.questionIndex + 1, session.totalQuestions);
  const answeredCorrectly = session.isAnswered && session.lastAnswerCorrect === true;
  const correctAnswer = prepared && session.isAnswered ? correctAnswerText(prepared) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="overflow-hidden rounded-[2rem] border-2 border-rose-200 bg-white shadow-[0_6px_0_#fecdd3,0_16px_34px_rgba(23,32,42,0.07)]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-rose-100 bg-gradient-to-r from-rose-50 via-white to-amber-50 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-2 text-sm font-black text-ink-600 transition hover:bg-white hover:text-rose-700"
            aria-label="Prekini ponavljanje i vrati se na početnu"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-white text-base shadow-sm" aria-hidden="true">
              ←
            </span>
            <span className="hidden sm:inline">Izađi</span>
          </Link>
          <div className="min-w-0 text-center">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-rose-700">
              Ponovi greške
            </p>
            <p className="truncate text-base font-black text-ink-950 sm:text-lg">
              Ne troši srca
            </p>
          </div>
          <span
            className="shrink-0 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-black text-brand-700"
            role="status"
            aria-label={`${session.correctCount} ispravljenih pitanja`}
          >
            ✓ {session.correctCount}
          </span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-ink-600">
                Popravni krug
              </p>
              <p className="mt-1 font-black text-ink-950">
                Točan odgovor briše pitanje s popisa
              </p>
            </div>
            <span className="shrink-0 text-sm font-extrabold text-ink-600">
              {displayQuestionNumber}/{session.totalQuestions}
            </span>
          </div>
          <ProgressBar
            value={session.questionIndex + (session.isAnswered ? 1 : 0)}
            max={session.totalQuestions}
            label="Napredak ponavljanja"
            showValue
          />
        </div>
      </header>

      {prepared && (
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-rose-100/80 via-transparent to-amber-100/70 blur-lg"
            aria-hidden="true"
          />
          <QuestionCard
            key={`review-${session.questionIndex}`}
            eyebrow="Ovo si već jednom promašio"
            question={prepared.question.question}
          >
            <QuestionBody
              key={`review-body-${session.questionIndex}`}
              prepared={prepared}
              isAnswered={session.isAnswered}
              onAnswer={session.answerQuestion}
              questionNumber={displayQuestionNumber}
            />
          </QuestionCard>
        </div>
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
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl text-2xl font-black text-white shadow-sm ${
                  answeredCorrectly ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                aria-hidden="true"
              >
                {answeredCorrectly ? '✓' : '×'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-lg font-black ${answeredCorrectly ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {answeredCorrectly
                    ? 'Točno — ovo pitanje je sad naučeno!'
                    : 'Još ne — ostaje na popisu za ponavljanje.'}
                </p>
                {correctAnswer && !answeredCorrectly && (
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink-800">
                    <span className="font-black">Točan odgovor:</span> {correctAnswer}
                  </p>
                )}
                {session.explanation && (
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-ink-600">
                    <span className="font-black text-ink-800">Zašto?</span> {session.explanation}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={session.nextQuestion}
                className={`min-h-12 shrink-0 rounded-2xl border-2 px-6 py-3 font-black text-white transition hover:-translate-y-0.5 active:translate-y-1 ${
                  answeredCorrectly
                    ? 'border-emerald-800 bg-emerald-600 shadow-[0_4px_0_#065f46] hover:bg-emerald-700'
                    : 'border-rose-800 bg-rose-600 shadow-[0_4px_0_#9f1239] hover:bg-rose-700'
                }`}
              >
                {session.questionIndex + 1 >= session.totalQuestions ? 'Prikaži rezultat' : 'Nastavi'}
                <span className="ml-2" aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ReviewPage;
