import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { loadQuestionsForScoreStrike } from '../data/questionLoader';
import { randomSessionSize, selectSessionPool } from '../lib/pool';
import {
  gradeAnswer,
  prepareQuestion,
  type AnswerPayload,
  type PreparedQuestion,
} from '../lib/questionKinds';
import { questionTimeMs, scoreAnswer } from '../lib/scoring';
import { useCountdown } from './useCountdown';
import { useProgress } from './useProgress';

const AUTO_ADVANCE_MS = 1100;

type Status = 'loading' | 'load-failed' | 'playing' | 'finished';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  score: number;
  combo: number;
  isAnswered: boolean;
  /** null i isAnswered=true znači istek vremena. */
  lastAnswerCorrect: boolean | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[] }
  | { type: 'LOAD_FAILED' }
  | { type: 'ANSWER'; correct: boolean; remainingMs: number; totalMs: number }
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
    lastAnswerCorrect: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...createIdleState(), status: 'playing', questions: action.questions };
    case 'LOAD_FAILED':
      return { ...createIdleState(), status: 'load-failed' };
    case 'ANSWER': {
      if (state.status !== 'playing' || state.isAnswered) return state;
      const { pointsAwarded, newCombo } = scoreAnswer({
        correct: action.correct,
        remainingMs: action.remainingMs,
        totalMs: action.totalMs,
        comboBeforeAnswer: state.combo,
      });
      return {
        ...state,
        isAnswered: true,
        lastAnswerCorrect: action.correct,
        score: state.score + pointsAwarded,
        combo: newCombo,
      };
    }
    case 'TIMEOUT': {
      if (state.status !== 'playing' || state.isAnswered) return state;
      return { ...state, isAnswered: true, lastAnswerCorrect: null, combo: 0 };
    }
    case 'NEXT': {
      if (state.status !== 'playing') return state;
      const nextIndex = state.questionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: 'finished' };
      }
      return { ...state, questionIndex: nextIndex, isAnswered: false, lastAnswerCorrect: null };
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

  // Pitanja stižu asinkrono, pa init čita progress kroz ref - do trenutka
  // dolaska chunka `progress` iz zatvorenja bi već mogao biti zastario.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    dispatch({ type: 'RESET' });
    // "mixed" dovlači sve teme; jedna tema dovlači samo svoj chunk.
    let cancelled = false;

    loadQuestionsForScoreStrike(topicIdOrMixed)
      .then((pool) => {
        if (cancelled || pool.length === 0) return;

        const recentIds = progressRef.current.scoreStrike[topicIdOrMixed]?.recentQuestionIds ?? [];
        const size = randomSessionSize();
        const picked = selectSessionPool(pool, recentIds, size);

        recordedRef.current = false;
        setIsNewBest(false);
        dispatch({ type: 'INIT', questions: picked.map(prepareQuestion) });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('techdingo: dohvat pitanja za Score Strike nije uspio.', err);
        dispatch({ type: 'LOAD_FAILED' });
      });

    return () => {
      cancelled = true;
    };
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
        questionIds: [...new Set(state.questions.map((q) => q.question.id))],
      });
      setIsNewBest(newBest);
    }
  }, [state.status, state.score, state.questions, topicIdOrMixed, recordScoreStrikeResult]);

  const current: PreparedQuestion | null = state.questions[state.questionIndex] ?? null;
  // Složenije vrste pitanja (multi/fill/order) dobivaju više vremena.
  const timeTotalMs = current ? questionTimeMs(current.kind) : questionTimeMs('single');

  const timeRemainingMs = useCountdown(
    timeTotalMs,
    state.questionIndex,
    state.status === 'playing' && !state.isAnswered,
    () => dispatch({ type: 'TIMEOUT' }),
  );

  const answerQuestion = useCallback(
    (payload: AnswerPayload) => {
      if (state.status !== 'playing' || state.isAnswered || !current) return;
      const correct = gradeAnswer(current, payload);
      const elapsed = Date.now() - questionStartedAtRef.current;
      const totalMs = questionTimeMs(current.kind);
      const remainingMs = Math.max(0, totalMs - elapsed);
      dispatch({ type: 'ANSWER', correct, remainingMs, totalMs });
    },
    [state.status, state.isAnswered, current],
  );

  const restart = useCallback(() => {
    setRestartNonce((n) => n + 1);
  }, []);

  return {
    status: state.status,
    questionIndex: state.questionIndex,
    totalQuestions: state.questions.length,
    prepared: current,
    isAnswered: state.isAnswered,
    lastAnswerCorrect: state.lastAnswerCorrect,
    explanation: state.isAnswered ? current?.question.explanation : undefined,
    score: state.score,
    combo: state.combo,
    timeRemainingMs,
    timeTotalMs,
    isNewBest,
    answerQuestion,
    restart,
  };
}
