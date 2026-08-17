import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getQuestionsForScoreStrike } from '../data/topics';
import { randomSessionSize, selectSessionPool, shuffleOptions } from '../lib/pool';
import { SCORE_STRIKE_QUESTION_TIME_MS, scoreAnswer } from '../lib/scoring';
import type { Question } from '../types/question';
import { useCountdown } from './useCountdown';
import { useProgress } from './useProgress';

const AUTO_ADVANCE_MS = 1100;

interface PreparedQuestion {
  question: Question;
  options: string[];
  correctIndex: number;
}

type Status = 'loading' | 'playing' | 'finished';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  score: number;
  combo: number;
  isAnswered: boolean;
  selectedOptionIndex: number | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[] }
  | { type: 'ANSWER'; optionIndex: number; remainingMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'NEXT' }
  | { type: 'RESET' };

function createIdleState(): State {
  return {
    status: 'loading',
    questions: [],
    questionIndex: 0,
    score: 0,
    combo: 0,
    isAnswered: false,
    selectedOptionIndex: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...createIdleState(), status: 'playing', questions: action.questions };
    case 'ANSWER': {
      if (state.status !== 'playing' || state.isAnswered) return state;
      const current = state.questions[state.questionIndex];
      const correct = action.optionIndex === current.correctIndex;
      const { pointsAwarded, newCombo } = scoreAnswer({
        correct,
        remainingMs: action.remainingMs,
        totalMs: SCORE_STRIKE_QUESTION_TIME_MS,
        comboBeforeAnswer: state.combo,
      });
      return {
        ...state,
        isAnswered: true,
        selectedOptionIndex: action.optionIndex,
        score: state.score + pointsAwarded,
        combo: newCombo,
      };
    }
    case 'TIMEOUT': {
      if (state.status !== 'playing' || state.isAnswered) return state;
      return { ...state, isAnswered: true, selectedOptionIndex: null, combo: 0 };
    }
    case 'NEXT': {
      if (state.status !== 'playing') return state;
      const nextIndex = state.questionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: 'finished' };
      }
      return { ...state, questionIndex: nextIndex, isAnswered: false, selectedOptionIndex: null };
    }
    case 'RESET':
      return createIdleState();
    default:
      return state;
  }
}

export function useScoreStrikeSession(topicIdOrMixed: string) {
  const [state, dispatch] = useReducer(reducer, undefined, createIdleState);
  const [restartNonce, setRestartNonce] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const { state: progress, recordScoreStrikeResult } = useProgress();
  const recordedRef = useRef(false);
  const questionStartedAtRef = useRef(Date.now());

  useEffect(() => {
    dispatch({ type: 'RESET' });
    const pool = getQuestionsForScoreStrike(topicIdOrMixed);
    if (pool.length === 0) return;

    const recentIds = progress.scoreStrike[topicIdOrMixed]?.recentQuestionIds ?? [];
    const size = randomSessionSize();
    const picked = selectSessionPool(pool, recentIds, size);
    const prepared: PreparedQuestion[] = picked.map((q) => {
      const { options, correctIndex } = shuffleOptions(q);
      return { question: q, options, correctIndex };
    });

    recordedRef.current = false;
    setIsNewBest(false);
    dispatch({ type: 'INIT', questions: prepared });
    // Namjerno bez `progress` u deps - vidi useLessonSession za obrazloženje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicIdOrMixed, restartNonce]);

  // Novi početak mjerenja vremena čim se prikaže novo (neodgovoreno) pitanje.
  useEffect(() => {
    if (state.status === 'playing' && !state.isAnswered) {
      questionStartedAtRef.current = Date.now();
    }
  }, [state.status, state.isAnswered, state.questionIndex]);

  // Automatski prelazak na sljedeće pitanje nakon kratke pauze s feedbackom.
  useEffect(() => {
    if (state.status !== 'playing' || !state.isAnswered) return;
    const id = window.setTimeout(() => dispatch({ type: 'NEXT' }), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [state.status, state.isAnswered, state.questionIndex]);

  useEffect(() => {
    if (state.status === 'finished' && !recordedRef.current) {
      recordedRef.current = true;
      const { isNewBest: newBest } = recordScoreStrikeResult(topicIdOrMixed, {
        score: state.score,
        questionIds: state.questions.map((q) => q.question.id),
      });
      setIsNewBest(newBest);
    }
  }, [state.status, state.score, state.questions, topicIdOrMixed, recordScoreStrikeResult]);

  const timeRemainingMs = useCountdown(
    SCORE_STRIKE_QUESTION_TIME_MS,
    state.questionIndex,
    state.status === 'playing' && !state.isAnswered,
    () => dispatch({ type: 'TIMEOUT' }),
  );

  const answerQuestion = useCallback((optionIndex: number) => {
    const elapsed = Date.now() - questionStartedAtRef.current;
    const remainingMs = Math.max(0, SCORE_STRIKE_QUESTION_TIME_MS - elapsed);
    dispatch({ type: 'ANSWER', optionIndex, remainingMs });
  }, []);

  const restart = useCallback(() => {
    setRestartNonce((n) => n + 1);
  }, []);

  const current = state.questions[state.questionIndex];

  return {
    status: state.status,
    questionIndex: state.questionIndex,
    totalQuestions: state.questions.length,
    currentQuestion: current ? { question: current.question.question, options: current.options } : null,
    isAnswered: state.isAnswered,
    selectedOptionIndex: state.selectedOptionIndex,
    correctOptionIndex: state.isAnswered && current ? current.correctIndex : null,
    explanation: state.isAnswered ? current?.question.explanation : undefined,
    score: state.score,
    combo: state.combo,
    timeRemainingMs,
    timeTotalMs: SCORE_STRIKE_QUESTION_TIME_MS,
    isNewBest,
    answerQuestion,
    restart,
  };
}
