import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { getTopic } from '../data/topics';
import { unitProgressKey } from '../data/units';
import {
  randomSessionSize,
  randomUnitSessionSize,
  selectSessionPool,
  shuffleOptions,
} from '../lib/pool';
import { resolveHearts } from '../state/hearts';
import type { Question } from '../types/question';
import { useProgress } from './useProgress';

interface PreparedQuestion {
  question: Question;
  options: string[];
  correctIndex: number;
}

type Status = 'loading' | 'no-hearts' | 'playing' | 'passed' | 'failed';

interface State {
  status: Status;
  questions: PreparedQuestion[];
  questionIndex: number;
  hearts: number;
  correctCount: number;
  wrongQuestionIds: string[];
  isAnswered: boolean;
  selectedOptionIndex: number | null;
}

type Action =
  | { type: 'INIT'; questions: PreparedQuestion[]; hearts: number }
  | { type: 'NO_HEARTS' }
  | { type: 'ANSWER'; optionIndex: number }
  | { type: 'NEXT' }
  | { type: 'RESET' };

function createIdleState(): State {
  return {
    status: 'loading',
    questions: [],
    questionIndex: 0,
    hearts: 0,
    correctCount: 0,
    wrongQuestionIds: [],
    isAnswered: false,
    selectedOptionIndex: null,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return {
        ...createIdleState(),
        status: 'playing',
        questions: action.questions,
        hearts: action.hearts,
      };
    case 'NO_HEARTS':
      return { ...createIdleState(), status: 'no-hearts' };
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
        wrongQuestionIds: correct
          ? state.wrongQuestionIds
          : [...new Set([...state.wrongQuestionIds, current.question.id])],
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

/**
 * Lekcija cijele teme (`unitId` izostavljen, sesija 15-17 pitanja) ili jedne
 * cjeline (`unitId` zadan, sesija 8-10 pitanja s dopuštenim ponavljanjem za
 * male banke). Srca su TRAJNA (globalna zaliha, vidi state/hearts.ts): svaka
 * greška troši jedno iz zalihe, a s praznom zalihom lekcija se ne može
 * pokrenuti (status "no-hearts" - UI nudi čekanje regeneracije ili reklamu).
 */
export function useLessonSession(topicId: string, unitId?: string) {
  const [state, dispatch] = useReducer(reducer, undefined, createIdleState);
  const [restartNonce, setRestartNonce] = useState(0);
  const { state: progress, recordLessonResult, spendHeart, syncHearts } = useProgress();
  const recordedRef = useRef(false);

  const lessonKey = unitId ? unitProgressKey(topicId, unitId) : topicId;

  // Ref umjesto direktnog čitanja `progress` u init-efektu: efekt namjerno ne
  // ovisi o progressu (vidi komentar u depsu), ali pri restartu želi SVJEŽE stanje.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    dispatch({ type: 'RESET' });
    syncHearts(); // materijaliziraj eventualnu regeneraciju prije provjere zalihe

    const topic = getTopic(topicId);
    if (!topic || topic.questions.length === 0) return;

    const questions = unitId ? topic.questions.filter((q) => q.unitId === unitId) : topic.questions;
    if (questions.length === 0) return;

    const heartsAvailable = resolveHearts(progressRef.current.hearts).balance;
    if (heartsAvailable <= 0) {
      dispatch({ type: 'NO_HEARTS' });
      return;
    }

    const lessonProgress = progressRef.current.lessons[lessonKey];
    const recentIds = lessonProgress?.recentQuestionIds ?? [];
    const priorityIds = lessonProgress?.struggledQuestionIds ?? [];
    const size = unitId ? randomUnitSessionSize() : randomSessionSize();
    const picked = selectSessionPool(questions, recentIds, size, {
      priorityIds,
      allowRepeats: Boolean(unitId),
    });
    const prepared: PreparedQuestion[] = picked.map((q) => {
      const { options, correctIndex } = shuffleOptions(q);
      return { question: q, options, correctIndex };
    });

    recordedRef.current = false;
    dispatch({ type: 'INIT', questions: prepared, hearts: heartsAvailable });
    // Namjerno bez `progress` u deps - inače bi zapisivanje rezultata na
    // kraju sesije (koje mijenja progress store) ponovno pokrenulo init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, unitId, restartNonce]);

  useEffect(() => {
    if ((state.status === 'passed' || state.status === 'failed') && !recordedRef.current) {
      recordedRef.current = true;
      recordLessonResult(lessonKey, {
        passed: state.status === 'passed',
        correctCount: state.correctCount,
        questionIds: [...new Set(state.questions.map((q) => q.question.id))],
        wrongQuestionIds: state.wrongQuestionIds,
      });
    }
  }, [state.status, state.correctCount, state.questions, state.wrongQuestionIds, lessonKey, recordLessonResult]);

  const answerQuestion = useCallback(
    (optionIndex: number) => {
      const current = state.questions[state.questionIndex];
      if (state.status === 'playing' && !state.isAnswered && current) {
        if (optionIndex !== current.correctIndex) {
          spendHeart(); // trajna zaliha - greška se pamti i nakon lekcije
        }
        dispatch({ type: 'ANSWER', optionIndex });
      }
    },
    [state.status, state.isAnswered, state.questions, state.questionIndex, spendHeart],
  );

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
