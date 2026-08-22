import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { shuffle } from '../lib/shuffle';
import {
  gradeAnswer,
  prepareQuestion,
  type AnswerPayload,
  type PreparedQuestion,
} from '../lib/questionKinds';
import { MAX_REVIEW_SESSION_SIZE, collectStruggledQuestions } from '../lib/review';
import { useProgress } from './useProgress';

type Status = 'loading' | 'empty' | 'playing' | 'finished';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  correctCount: number;
  correctQuestionIds: string[];
  stillWrongCount: number;
  isAnswered: boolean;
  lastAnswerCorrect: boolean | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[] }
  | { type: 'EMPTY' }
  | { type: 'ANSWER'; correct: boolean; questionId: string }
  | { type: 'NEXT' };

function createIdleState(): State {
  return {
    status: 'loading',
    questions: [],
    questionIndex: 0,
    correctCount: 0,
    correctQuestionIds: [],
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
  const remainingAfterSession = collectStruggledQuestions(progress).length;

  useEffect(() => {
    const struggled = collectStruggledQuestions(progressRef.current);
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
      });
    }
  }, [state.status, state.correctQuestionIds, state.correctCount, recordReviewResult]);

  const current: PreparedQuestion | null = state.questions[state.questionIndex] ?? null;

  const answerQuestion = useCallback(
    (payload: AnswerPayload) => {
      if (state.status !== 'playing' || state.isAnswered || !current) return;
      dispatch({
        type: 'ANSWER',
        correct: gradeAnswer(current, payload),
        questionId: current.question.id,
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
