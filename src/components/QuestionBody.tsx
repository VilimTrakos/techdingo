import { useState } from 'react';
import { OptionButton, type OptionState } from './OptionButton';
import type { AnswerPayload, PreparedQuestion } from '../lib/questionKinds';

interface QuestionBodyProps {
  prepared: PreparedQuestion;
  isAnswered: boolean;
  onAnswer: (payload: AnswerPayload) => void;
  questionNumber: number;
}

/**
 * Interakcijski dio pitanja za sve četiri vrste (single/multi/fill/order).
 * Roditelj ga OBAVEZNO key-a po indeksu pitanja da se interni odabir resetira
 * pri svakom novom pitanju. Post-answer stanja renderira sam (zna svoj odabir).
 */
export function QuestionBody({ prepared, isAnswered, onAnswer, questionNumber }: QuestionBodyProps) {
  return (
    <div>
      {prepared.question.code && (
        <div className="mb-5 overflow-hidden rounded-2xl border-[3px] border-ink-800 bg-ink-950 shadow-[0_5px_0_#667382]">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-brand-300" />
            <span className="ml-2 text-[0.65rem] font-black uppercase tracking-[0.18em] text-cloud-200">Kod</span>
          </div>
          <pre
            className="overflow-x-auto p-4 text-sm leading-6 text-cloud-50"
            aria-label="Isječak koda uz pitanje"
          >
            <code>{prepared.question.code}</code>
          </pre>
        </div>
      )}
      {prepared.kind === 'single' && (
        <SingleBody prepared={prepared} isAnswered={isAnswered} onAnswer={onAnswer} questionNumber={questionNumber} />
      )}
      {prepared.kind === 'multi' && (
        <MultiBody prepared={prepared} isAnswered={isAnswered} onAnswer={onAnswer} questionNumber={questionNumber} />
      )}
      {prepared.kind === 'fill' && (
        <FillBody prepared={prepared} isAnswered={isAnswered} onAnswer={onAnswer} />
      )}
      {prepared.kind === 'order' && (
        <OrderBody prepared={prepared} isAnswered={isAnswered} onAnswer={onAnswer} />
      )}
    </div>
  );
}

function ConfirmButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="game-button game-button-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
    >
      Provjeri
    </button>
  );
}

function SingleBody({
  prepared,
  isAnswered,
  onAnswer,
  questionNumber,
}: {
  prepared: Extract<PreparedQuestion, { kind: 'single' }>;
  isAnswered: boolean;
  onAnswer: (payload: AnswerPayload) => void;
  questionNumber: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-3" role="group" aria-label={`Ponuđeni odgovori za pitanje ${questionNumber}`}>
      {prepared.options.map((option, index) => {
        let state: OptionState = 'idle';
        if (isAnswered) {
          if (index === prepared.correctIndex) state = 'correct';
          else if (index === selectedIndex) state = 'incorrect';
          else state = 'disabled';
        }
        return (
          <OptionButton
            key={`${index}-${option}`}
            index={index}
            state={state}
            disabled={isAnswered}
            onClick={() => {
              setSelectedIndex(index);
              onAnswer({ kind: 'single', optionIndex: index });
            }}
          >
            {option}
          </OptionButton>
        );
      })}
    </div>
  );
}

function MultiBody({
  prepared,
  isAnswered,
  onAnswer,
  questionNumber,
}: {
  prepared: Extract<PreparedQuestion, { kind: 'multi' }>;
  isAnswered: boolean;
  onAnswer: (payload: AnswerPayload) => void;
  questionNumber: number;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div>
      <p className="mb-3 text-sm font-black uppercase tracking-wider text-ink-600">
        Odaberi sve točne odgovore
      </p>
      <div className="grid gap-3" role="group" aria-label={`Ponuđeni odgovori za pitanje ${questionNumber} (više točnih)`}>
        {prepared.options.map((option, index) => {
          let state: OptionState = selected.has(index) ? 'selected' : 'idle';
          if (isAnswered) {
            if (prepared.correctIndexes.includes(index)) state = 'correct';
            else if (selected.has(index)) state = 'incorrect';
            else state = 'disabled';
          }
          return (
            <OptionButton
              key={`${index}-${option}`}
              index={index}
              state={state}
              disabled={isAnswered}
              onClick={() => toggle(index)}
            >
              {option}
            </OptionButton>
          );
        })}
      </div>
      {!isAnswered && (
        <ConfirmButton
          disabled={selected.size === 0}
          onClick={() => onAnswer({ kind: 'multi', selectedIndexes: [...selected] })}
        />
      )}
    </div>
  );
}

function FillBody({
  prepared,
  isAnswered,
  onAnswer,
}: {
  prepared: Extract<PreparedQuestion, { kind: 'fill' }>;
  isAnswered: boolean;
  onAnswer: (payload: AnswerPayload) => void;
}) {
  const blanksCount = prepared.question.answers.length;
  const [placed, setPlaced] = useState<(string | null)[]>(Array(blanksCount).fill(null));

  // Ista riječ smije biti u banci samo jednom - potrošene riječi nestaju iz banke.
  const usedWords = new Set(placed.filter((w): w is string => w !== null));

  const placeWord = (word: string) => {
    const firstEmpty = placed.indexOf(null);
    if (firstEmpty === -1) return;
    setPlaced((prev) => {
      const next = [...prev];
      next[firstEmpty] = word;
      return next;
    });
  };

  const removeAt = (index: number) => {
    setPlaced((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // Tekst se dijeli po prazninama; između segmenata dolaze slotovi.
  const segments = prepared.question.text.split('___');
  let blankCursor = -1;

  return (
    <div>
      <p className="mb-3 text-sm font-black uppercase tracking-wider text-ink-600">
        Popuni praznine riječima iz banke
      </p>
      <p className="rounded-2xl border-2 border-cloud-200 bg-cloud-50 p-4 font-mono text-sm leading-9 text-ink-950">
        {segments.map((segment, i) => {
          if (i === 0) return <span key={`seg-${i}`}>{segment}</span>;
          blankCursor++;
          const slotIndex = blankCursor;
          const word = placed[slotIndex];
          const isCorrectWord = word === prepared.question.answers[slotIndex];
          return (
            <span key={`seg-${i}`}>
              {word !== null ? (
                <button
                  type="button"
                  disabled={isAnswered}
                  onClick={() => removeAt(slotIndex)}
                  className={`mx-1 inline-flex min-h-8 items-center rounded-lg border-2 px-2.5 font-black shadow-[0_2px_0_currentColor] transition disabled:cursor-default ${
                    isAnswered
                      ? isCorrectWord
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                        : 'border-rose-500 bg-rose-100 text-rose-800'
                      : 'border-brand-300 bg-brand-100 text-brand-800 hover:-translate-y-0.5'
                  }`}
                  aria-label={`Praznina ${slotIndex + 1}: ${word}. Klikni za uklanjanje.`}
                >
                  {word}
                </button>
              ) : (
                <span
                  className="mx-1 inline-flex min-h-8 min-w-16 items-center justify-center rounded-lg border-2 border-dashed border-ink-400 bg-white px-2.5 text-ink-400"
                  aria-label={`Prazno mjesto ${slotIndex + 1}`}
                >
                  &nbsp;
                </span>
              )}
              {segment}
            </span>
          );
        })}
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Banka riječi">
        {prepared.wordBank.map((word, i) => (
          <button
            key={`${word}-${i}`}
            type="button"
            disabled={isAnswered || usedWords.has(word)}
            onClick={() => placeWord(word)}
            className="min-h-10 rounded-xl border-2 border-cloud-200 bg-white px-3.5 py-2 font-mono text-sm font-black text-ink-950 shadow-[0_3px_0_rgba(23,32,42,0.12)] transition hover:-translate-y-0.5 hover:border-brand-300 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
          >
            {word}
          </button>
        ))}
      </div>

      {!isAnswered && (
        <ConfirmButton
          disabled={placed.some((w) => w === null)}
          onClick={() =>
            onAnswer({ kind: 'fill', words: placed.filter((w): w is string => w !== null) })
          }
        />
      )}
    </div>
  );
}

function OrderBody({
  prepared,
  isAnswered,
  onAnswer,
}: {
  prepared: Extract<PreparedQuestion, { kind: 'order' }>;
  isAnswered: boolean;
  onAnswer: (payload: AnswerPayload) => void;
}) {
  const [ordered, setOrdered] = useState<string[]>([]);
  const remaining = prepared.shuffledSteps.filter((step) => !ordered.includes(step));

  return (
    <div>
      <p className="mb-3 text-sm font-black uppercase tracking-wider text-ink-600">
        Tapkaj korake u točnom redoslijedu
      </p>

      <ol
        className="grid min-h-14 gap-2 rounded-2xl border-2 border-dashed border-cloud-200 bg-cloud-50 p-3"
        aria-label="Tvoj redoslijed (klikni korak za uklanjanje)"
      >
        {ordered.length === 0 && (
          <li className="grid place-items-center py-2 text-sm font-bold text-ink-400">
            Ovdje slaži korake…
          </li>
        )}
        {ordered.map((step, i) => {
          const isCorrectStep = step === prepared.question.steps[i];
          return (
            <li key={step}>
            <button
              type="button"
              disabled={isAnswered}
              onClick={() => setOrdered((prev) => prev.filter((s) => s !== step))}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left font-bold shadow-[0_3px_0_#b8efc1] transition disabled:cursor-default ${
                isAnswered
                  ? isCorrectStep
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-rose-500 bg-rose-50 text-rose-950'
                  : 'border-brand-300 bg-white text-ink-950 hover:-translate-y-0.5 hover:border-rose-300'
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-sm font-black text-brand-800" aria-hidden="true">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{step}</span>
              {!isAnswered && (
                <span className="text-ink-400" aria-hidden="true">×</span>
              )}
              {isAnswered && (
                <span className="text-xl font-black" aria-hidden="true">
                  {isCorrectStep ? '✓' : '×'}
                </span>
              )}
            </button>
            </li>
          );
        })}
      </ol>

      {remaining.length > 0 && (
        <div className="mt-4 grid gap-2" role="group" aria-label="Preostali koraci">
          {remaining.map((step) => (
            <button
              key={step}
              type="button"
              disabled={isAnswered}
              onClick={() => setOrdered((prev) => [...prev, step])}
              className="w-full rounded-xl border-2 border-cloud-200 bg-white px-4 py-2.5 text-left font-bold text-ink-950 shadow-[0_3px_0_rgba(23,32,42,0.12)] transition hover:-translate-y-0.5 hover:border-brand-300 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {step}
            </button>
          ))}
        </div>
      )}

      {!isAnswered && (
        <ConfirmButton
          disabled={ordered.length !== prepared.shuffledSteps.length}
          onClick={() => onAnswer({ kind: 'order', orderedSteps: ordered })}
        />
      )}
    </div>
  );
}

export default QuestionBody;
