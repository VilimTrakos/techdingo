import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getTopic } from '../data/topics';
import { randomSessionSize, selectSessionPool, shuffleOptions } from '../lib/pool';
import type { Question } from '../types/question';
import { useProgress } from './useProgress';

const START_HEARTS = 5;

interface PreparedQuestion {
  question: Question;
  options: string[];
  correctIndex: number;
}

type Status = 'loading' | 'playing' | 'passed' | 'failed';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  hearts: number;
  correctCount: number;
  isAnswered: boolean;
  selectedOptionIndex: number | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[] }
  | { type: 'ANSWER'; optionIndex: number }
  | { type: 'NEXT' }
  | { type: 'RESET' };

function createIdleState(): State {
  return {
    status: 'loading',
    questions: [],
    questionIndex: 0,
    hearts: START_HEARTS,
    correctCount: 0,
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
      const hearts = correct ? state.hearts : state.hearts - 1;
      return {
        ...state,
        isAnswered: true,
        selectedOptionIndex: action.optionIndex,
        correctCount: state.correctCount + (correct ? 1 : 0),
        hearts,
        status: hearts <= 0 ? 'failed' : state.status,
      };
    }
    case 'NEXT': {
      if (state.status !== 'playing') return state;
      const nextIndex = state.questionIndex + 1;
      if (nextIndex >= state.questions.length) {
        return { ...state, status: 'passed' };
      }
      return { ...state, questionIndex: nextIndex, isAnswered: false, selectedOptionIndex: null };
    }
    case 'RESET':
      return createIdleState();
    default:
      return state;
  }
}

export function useLessonSession(topicId: string) {
  const [state, dispatch] = useReducer(reducer, undefined, createIdleState);
  const [restartNonce, setRestartNonce] = useState(0);
  const { state: progress, recordLessonResult } = useProgress();
  const recordedRef = useRef(false);

  useEffect(() => {
    dispatch({ type: 'RESET' });
    const topic = getTopic(topicId);
    if (!topic || topic.questions.length === 0) return;

    const recentIds = progress.lessons[topicId]?.recentQuestionIds ?? [];
    const size = randomSessionSize();
    const picked = selectSessionPool(topic.questions, recentIds, size);
    const prepared: PreparedQuestion[] = picked.map((q) => {
      const { options, correctIndex } = shuffleOptions(q);
      return { question: q, options, correctIndex };
    });

    recordedRef.current = false;
    dispatch({ type: 'INIT', questions: prepared });
    // Namjerno bez `progress` u deps - inače bi zapisivanje rezultata na
    // kraju sesije (koje mijenja progress store) ponovno pokrenulo init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, restartNonce]);

  useEffect(() => {
    if ((state.status === 'passed' || state.status === 'failed') && !recordedRef.current) {
      recordedRef.current = true;
      recordLessonResult(topicId, {
        passed: state.status === 'passed',
        correctCount: state.correctCount,
        questionIds: state.questions.map((q) => q.question.id),
      });
    }
  }, [state.status, state.correctCount, state.questions, topicId, recordLessonResult]);

  const answerQuestion = useCallback((optionIndex: number) => {
    dispatch({ type: 'ANSWER', optionIndex });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT' });
  }, []);

  const restart = useCallback(() => {
    setRestartNonce((n) => n + 1);
  }, []);

  const current = state.questions[state.questionIndex];

  return {
    status: state.status,
    questionIndex: state.questionIndex,
    totalQuestions: state.questions.length,
    hearts: state.hearts,
    currentQuestion: current ? { question: current.question.question, options: current.options } : null,
    isAnswered: state.isAnswered,
    selectedOptionIndex: state.selectedOptionIndex,
    correctOptionIndex: state.isAnswered && current ? current.correctIndex : null,
    explanation: state.isAnswered ? current?.question.explanation : undefined,
    correctCount: state.correctCount,
    answerQuestion,
    nextQuestion,
    restart,
  };
}
