import { useCallback, useEffect, useReducer, useRef } from 'react';
import { getQuestionsForScoreStrike } from '../data/topics';
import { selectDailyQuestions } from '../lib/daily';
import {
  gradeAnswer,
  prepareQuestion,
  type AnswerPayload,
  type PreparedQuestion,
} from '../lib/questionKinds';
import { questionTimeMs, scoreAnswer } from '../lib/scoring';
import { toLocalDateISO } from '../state/streak';
import { useCountdown } from './useCountdown';
import { useProgress } from './useProgress';

const AUTO_ADVANCE_MS = 1100;

type Status = 'loading' | 'already-played' | 'playing' | 'finished';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  score: number;
  combo: number;
  isAnswered: boolean;
  lastAnswerCorrect: boolean | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[] }
  | { type: 'ALREADY_PLAYED' }
  | { type: 'ANSWER'; correct: boolean; remainingMs: number; totalMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'NEXT' };

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
    case 'ALREADY_PLAYED':
      return { ...createIdleState(), status: 'already-played' };
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
    default:
      return state;
  }
}

/**
 * Dnevni izazov: seedirani skup pitanja (isti za sve igrače istog dana,
 * vidi lib/daily.ts), Score Strike pravila (timer/combo/bodovi), jedno
 * igranje dnevno. Ne troši srca.
 */
export function useDailyChallengeSession() {
  const [state, dispatch] = useReducer(reducer, undefined, createIdleState);
  const { state: progress, recordDailyChallengeResult } = useProgress();
  const recordedRef = useRef(false);
  const questionStartedAtRef = useRef(Date.now());

  const todayISO = toLocalDateISO();

  useEffect(() => {
    if (progress.dailyChallenge.lastPlayedDateISO === todayISO) {
      dispatch({ type: 'ALREADY_PLAYED' });
      return;
    }
    const pool = getQuestionsForScoreStrike('mixed');
    if (pool.length === 0) return;
    const picked = selectDailyQuestions(todayISO, pool);
    recordedRef.current = false;
    dispatch({ type: 'INIT', questions: picked.map(prepareQuestion) });
    // Namjerno bez `progress` u deps - zapisivanje rezultata na kraju bi
    // ponovno pokrenulo init (i prikazalo "već odigrano" umjesto rezultata).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayISO]);

  useEffect(() => {
    if (state.status === 'playing' && !state.isAnswered) {
      questionStartedAtRef.current = Date.now();
    }
  }, [state.status, state.isAnswered, state.questionIndex]);

  useEffect(() => {
    if (state.status !== 'playing' || !state.isAnswered) return;
    const id = window.setTimeout(() => dispatch({ type: 'NEXT' }), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [state.status, state.isAnswered, state.questionIndex]);

  useEffect(() => {
    if (state.status === 'finished' && !recordedRef.current) {
      recordedRef.current = true;
      recordDailyChallengeResult({ score: state.score });
    }
  }, [state.status, state.score, recordDailyChallengeResult]);

  const current: PreparedQuestion | null = state.questions[state.questionIndex] ?? null;
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

  return {
    status: state.status,
    todayISO,
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
    lastScore: progress.dailyChallenge.lastScore,
    bestScore: progress.dailyChallenge.bestScore,
    answerQuestion,
  };
}
