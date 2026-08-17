import { Link, useParams } from 'react-router-dom';
import { HeartsDisplay } from '../components/HeartsDisplay';
import { OptionButton } from '../components/OptionButton';
import { ProgressBar } from '../components/ProgressBar';
import { QuestionCard } from '../components/QuestionCard';
import { ResultsSummary } from '../components/ResultsSummary';
import { TOPICS } from '../data/topics';
import { useLessonSession } from '../hooks/useLessonSession';

type LessonSessionProps = {
  topicId: string;
  topicLabel: string;
};

function LessonSession({ topicId, topicLabel }: LessonSessionProps) {
  const session = useLessonSession(topicId);

  if (session.status === 'loading') {
    return <SessionLoading label="Pripremamo tvoju lekciju…" />;
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
          homeHref="/"
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

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Prekini lekciju i vrati se na početnu"
          >
            <span aria-hidden="true">←</span>&nbsp; Početna
          </Link>
          <HeartsDisplay hearts={session.hearts} maxHearts={5} />
        </div>
        <ProgressBar
          value={session.questionIndex + (session.isAnswered ? 1 : 0)}
          max={session.totalQuestions}
          label={`Napredak lekcije: pitanje ${displayQuestionNumber} od ${session.totalQuestions}`}
        />
      </header>

      {question ? (
        <QuestionCard
          eyebrow={`${topicLabel} · Pitanje ${displayQuestionNumber} od ${session.totalQuestions}`}
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
      ) : (
        <SessionLoading label="Učitavamo sljedeće pitanje…" />
      )}

      {session.isAnswered && (
        <div
          className={`rounded-2xl border p-5 ${
            session.selectedOptionIndex === session.correctOptionIndex
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-rose-200 bg-rose-50'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className={`text-lg font-black ${
                  session.selectedOptionIndex === session.correctOptionIndex
                    ? 'text-emerald-800'
                    : 'text-rose-800'
                }`}
              >
                {session.selectedOptionIndex === session.correctOptionIndex
                  ? 'Točno!'
                  : correctAnswer
                    ? `Nije točno. Točan odgovor: ${correctAnswer}`
                    : 'Nije točno.'}
              </p>
              {session.explanation && (
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-700">
                  {session.explanation}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={session.nextQuestion}
              className="min-h-12 shrink-0 rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {session.questionIndex + 1 >= session.totalQuestions
                ? 'Prikaži rezultat'
                : 'Sljedeće pitanje'}
            </button>
          </div>
        </div>
      )}
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
        className="h-11 w-11 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600"
        aria-hidden="true"
      />
      <p className="font-bold text-slate-600">{label}</p>
    </div>
  );
}

export function LessonPage() {
  const { topicId = '' } = useParams();
  const topic = TOPICS.find((candidate) => candidate.id === topicId);

  if (!topic) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm sm:p-10">
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
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 font-black text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Pogledaj teme
        </Link>
      </div>
    );
  }

  return <LessonSession topicId={topic.id} topicLabel={topic.labelHr} />;
}

export default LessonPage;
