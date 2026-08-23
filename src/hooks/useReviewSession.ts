import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { shuffle } from '../lib/shuffle';
import {
  gradeAnswer,
  prepareQuestion,
  type AnswerPayload,
  type PreparedQuestion,
} from '../lib/questionKinds';
import {
  MAX_REVIEW_SESSION_SIZE,
  collectStruggledQuestions,
  countStruggledQuestions,
} from '../lib/review';
import { conceptOf } from '../types/question';
import { useProgress } from './useProgress';

type Status = 'loading' | 'empty' | 'playing' | 'finished' | 'load-failed';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  correctCount: number;
  correctQuestionIds: string[];
  /** conceptId -> točno? Hrani Leitner raspored. */
  conceptResults: Record<string, boolean>;
  stillWrongCount: number;
  isAnswered: boolean;
  lastAnswerCorrect: boolean | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[] }
  | { type: 'EMPTY' }
  | { type: 'LOAD_FAILED' }
  | { type: 'ANSWER'; correct: boolean; questionId: string; conceptId: string }
  | { type: 'NEXT' };

function createIdleState(): State {
  return {
    status: 'loading',
    questions: [],
    questionIndex: 0,
    correctCount: 0,
    correctQuestionIds: [],
    conceptResults: {},
    stillWrongCount: 0,
    isAnswered: false,
    lastAnswerCorrect: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...createIdleState(), status: 'playing', questions: action.questions };
    case 'EMPTY':
      return { ...createIdleState(), status: 'empty' };
    case 'LOAD_FAILED':
      return { ...createIdleState(), status: 'load-failed' };
    case 'ANSWER': {
      if (state.status !== 'playing' || state.isAnswered) return state;
      return {
        ...state,
        isAnswered: true,
        lastAnswerCorrect: action.correct,
        correctCount: state.correctCount + (action.correct ? 1 : 0),
        correctQuestionIds: action.correct
          ? [...state.correctQuestionIds, action.questionId]
          : state.correctQuestionIds,
        conceptResults: {
          ...state.conceptResults,
          [action.conceptId]: action.correct && state.conceptResults[action.conceptId] !== false,
        },
        stillWrongCount: state.stillWrongCount + (action.correct ? 0 : 1),
      };
    }
    case 'NEXT': {
      if (state.status !== 'playing') return state;
      const nextIndex = state.questionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: 'finished' };
      }
      return { ...state, questionIndex: nextIndex, isAnswered: false, lastAnswerCorrect: null };
    }
    default:
      return state;
  }
}

const DIFFICULTY_RANK: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * Ponavljanje grešaka: vježba ISKLJUČIVO pitanja koja je igrač ranije krivo
 * odgovorio, kroz sve teme i cjeline odjednom.
 *
 * NAMJERNO ne troši srca i nema fail-stanje: ovo je popravni mod, a kazniti
 * igrača koji ide ispravljati greške radilo bi protiv same svrhe (i bilo bi
 * nedostupno baš kad ostane bez srca, kad mu najviše treba).
 *
 * Točno odgovoreno pitanje ispada s popisa za ponavljanje (naučeno);
 * krivo ostaje za sljedeći put.
 */
export function useReviewSession() {
  const [state, dispatch] = useReducer(reducer, undefined, createIdleState);
  const [restartNonce, setRestartNonce] = useState(0);
  const { state: progress, recordReviewResult } = useProgress();
  const recordedRef = useRef(false);

  const progressRef = useRef(progress);
  progressRef.current = progress;

  // Broj preostalih grešaka čitamo iz ŽIVOG stanja (za prikaz nakon sesije).
  // Ide preko indeksa, pa je točan i prije nego ijedna tema bude dovučena.
  const remainingAfterSession = countStruggledQuestions(progress);

  useEffect(() => {
    // Sesija čeka da stignu teme u kojima greške žive (chunk po temi).
    // `cancelled` sprječava dispatch nakon što je komponenta otišla ili je
    // korisnik u međuvremenu pokrenuo restart.
    let cancelled = false;

    collectStruggledQuestions(progressRef.current)
      .then((struggled) => {
        if (cancelled) return;
        if (struggled.length === 0) {
          dispatch({ type: 'EMPTY' });
          return;
        }
        // Lakša pitanja prva - ista progresija kao u lekcijama.
        const picked = shuffle(struggled)
          .slice(0, MAX_REVIEW_SESSION_SIZE)
          .sort((a, b) => (DIFFICULTY_RANK[a.difficulty] ?? 1) - (DIFFICULTY_RANK[b.difficulty] ?? 1));

        recordedRef.current = false;
        dispatch({ type: 'INIT', questions: picked.map(prepareQuestion) });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('techdingo: dohvat pitanja za ponavljanje nije uspio.', err);
        dispatch({ type: 'LOAD_FAILED' });
      });

    return () => {
      cancelled = true;
    };
    // Namjerno bez `progress` u deps - zapisivanje rezultata mijenja progress
    // store i inače bi restartalo sesiju usred nje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartNonce]);

  useEffect(() => {
    if (state.status === 'finished' && !recordedRef.current) {
      recordedRef.current = true;
      recordReviewResult({
        correctQuestionIds: state.correctQuestionIds,
        correctCount: state.correctCount,
        conceptResults: state.conceptResults,
      });
    }
  }, [state.status, state.correctQuestionIds, state.correctCount, state.conceptResults, recordReviewResult]);

  const current: PreparedQuestion | null = state.questions[state.questionIndex] ?? null;

  const answerQuestion = useCallback(
    (payload: AnswerPayload) => {
      if (state.status !== 'playing' || state.isAnswered || !current) return;
      dispatch({
        type: 'ANSWER',
        correct: gradeAnswer(current, payload),
        questionId: current.question.id,
        conceptId: conceptOf(current.question),
      });
    },
    [state.status, state.isAnswered, current],
  );

  const nextQuestion = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const restart = useCallback(() => setRestartNonce((n) => n + 1), []);

  return {
    status: state.status,
    questionIndex: state.questionIndex,
    totalQuestions: state.questions.length,
    prepared: current,
    isAnswered: state.isAnswered,
    lastAnswerCorrect: state.lastAnswerCorrect,
    explanation: state.isAnswered ? current?.question.explanation : undefined,
    correctCount: state.correctCount,
    stillWrongCount: state.stillWrongCount,
    remainingAfterSession,
    answerQuestion,
    nextQuestion,
    restart,
  };
}
