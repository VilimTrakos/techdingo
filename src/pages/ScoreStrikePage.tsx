import { Link, useParams } from 'react-router-dom';
import { ComboBadge } from '../components/ComboBadge';
import { OptionButton } from '../components/OptionButton';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { ResultsSummary } from '../components/ResultsSummary';
import { Timer } from '../components/Timer';
import { TOPICS } from '../data/topics';
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

  const question = session.currentQuestion;
  const displayQuestionNumber = Math.min(
    session.questionIndex + 1,
    session.totalQuestions,
  );
  const answeredCorrectly =
    session.isAnswered &&
    session.selectedOptionIndex === session.correctOptionIndex;
  const correctAnswer =
    question && session.correctOptionIndex !== null
      ? question.options[session.correctOptionIndex]
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            aria-label="Prekini Score Strike i vrati se na početnu"
          >
            <span aria-hidden="true">←</span>&nbsp; Početna
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm"
              aria-live="polite"
              aria-label={`${session.score} bodova`}
            >
              <span className="block text-[0.65rem] font-black uppercase tracking-wider text-slate-600">
                Bodovi
              </span>
              <span className="text-xl font-black tabular-nums text-slate-900">
                {session.score}
              </span>
            </div>
            <ComboBadge combo={session.combo} />
          </div>
        </div>

        <ProgressBar
          value={session.questionIndex + (session.isAnswered ? 1 : 0)}
          max={session.totalQuestions}
          label={`Napredak izazova: pitanje ${displayQuestionNumber} od ${session.totalQuestions}`}
        />
        <Timer
          remainingMs={session.timeRemainingMs}
          totalMs={session.timeTotalMs}
        />
      </header>

      {question && (
        <QuestionCard
          eyebrow={`Score Strike · ${topicLabel} · ${displayQuestionNumber}/${session.totalQuestions}`}
          question={question.question}
        >
          <div
            className="grid gap-3"
            role="group"
            aria-label="Ponuđeni odgovori"
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
      )}

      <div className="min-h-20" aria-live="polite" aria-atomic="true">
        {session.isAnswered && (
          <div
            className={`rounded-2xl border p-4 ${
              answeredCorrectly
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
            role="status"
          >
            <p className="font-black">
              {answeredCorrectly
                ? 'Točno — combo raste!'
                : correctAnswer
                  ? `Nije točno. Točan odgovor: ${correctAnswer}`
                  : 'Nije točno.'}
            </p>
            {session.explanation && (
              <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                {session.explanation}
              </p>
            )}
          </div>
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
      <div className="mx-auto max-w-xl rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm sm:p-10">
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
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-amber-500 px-6 py-3 font-black text-slate-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
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
