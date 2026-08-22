import { shuffle } from './shuffle';
import {
  questionKind,
  type FillBlankQuestion,
  type MultiChoiceQuestion,
  type OrderStepsQuestion,
  type Question,
  type SingleChoiceQuestion,
} from '../types/question';

/**
 * Pitanje pripremljeno za jednu sesiju: redoslijed opcija/koraka/banke riječi
 * se miješa po sesiji (ne perzistira se), a točan odgovor se preračuna u
 * novi redoslijed. Diskriminirana unija - UI i ocjenjivanje granaju po `kind`.
 */
export type PreparedQuestion =
  | { kind: 'single'; question: SingleChoiceQuestion; options: string[]; correctIndex: number }
  | { kind: 'multi'; question: MultiChoiceQuestion; options: string[]; correctIndexes: number[] }
  | { kind: 'fill'; question: FillBlankQuestion; wordBank: string[] }
  | { kind: 'order'; question: OrderStepsQuestion; shuffledSteps: string[] };

/** Odgovor korisnika, oblik ovisan o vrsti pitanja. */
export type AnswerPayload =
  | { kind: 'single'; optionIndex: number }
  | { kind: 'multi'; selectedIndexes: number[] }
  | { kind: 'fill'; words: string[] }
  | { kind: 'order'; orderedSteps: string[] };

export function prepareQuestion(q: Question): PreparedQuestion {
  switch (questionKind(q)) {
    case 'multi': {
      const question = q as MultiChoiceQuestion;
      const indices = shuffle(question.options.map((_, i) => i));
      const correctSet = new Set(question.correctIndexes);
      return {
        kind: 'multi',
        question,
        options: indices.map((i) => question.options[i]),
        correctIndexes: indices
          .map((original, position) => (correctSet.has(original) ? position : -1))
          .filter((i) => i >= 0)
          .sort((a, b) => a - b),
      };
    }
    case 'fill': {
      const question = q as FillBlankQuestion;
      return {
        kind: 'fill',
        question,
        wordBank: shuffle([...question.answers, ...question.distractors]),
      };
    }
    case 'order': {
      const question = q as OrderStepsQuestion;
      let shuffledSteps = shuffle(question.steps);
      // Izmiješani redoslijed ne smije slučajno biti već točan - zavrti opet
      // (za >= 3 koraka rotacija za 1 je garantirano različita od originala).
      if (shuffledSteps.every((step, i) => step === question.steps[i])) {
        shuffledSteps = [...shuffledSteps.slice(1), shuffledSteps[0]];
      }
      return { kind: 'order', question, shuffledSteps };
    }
    case 'single':
    default: {
      const question = q as SingleChoiceQuestion;
      const indices = shuffle([0, 1, 2, 3]);
      return {
        kind: 'single',
        question,
        options: indices.map((i) => question.options[i]),
        correctIndex: indices.indexOf(question.correctIndex),
      };
    }
  }
}

export function gradeAnswer(prepared: PreparedQuestion, answer: AnswerPayload): boolean {
  if (prepared.kind !== answer.kind) return false;
  switch (prepared.kind) {
    case 'single':
      return (answer as { optionIndex: number }).optionIndex === prepared.correctIndex;
    case 'multi': {
      const selected = [...(answer as { selectedIndexes: number[] }).selectedIndexes].sort(
        (a, b) => a - b,
      );
      return (
        selected.length === prepared.correctIndexes.length &&
        selected.every((v, i) => v === prepared.correctIndexes[i])
      );
    }
    case 'fill': {
      const words = (answer as { words: string[] }).words;
      const expected = prepared.question.answers;
      return (
        words.length === expected.length &&
        words.every((w, i) => w.trim().toLowerCase() === expected[i].trim().toLowerCase())
      );
    }
    case 'order': {
      const ordered = (answer as { orderedSteps: string[] }).orderedSteps;
      const expected = prepared.question.steps;
      return ordered.length === expected.length && ordered.every((s, i) => s === expected[i]);
    }
  }
}

/** Tekst točnog odgovora za feedback panel nakon odgovora. */
export function correctAnswerText(prepared: PreparedQuestion): string {
  switch (prepared.kind) {
    case 'single':
      return prepared.options[prepared.correctIndex];
    case 'multi':
      return prepared.correctIndexes.map((i) => prepared.options[i]).join(' · ');
    case 'fill':
      return prepared.question.answers.join(', ');
    case 'order':
      return prepared.question.steps.map((s, i) => `${i + 1}. ${s}`).join(' → ');
  }
}
