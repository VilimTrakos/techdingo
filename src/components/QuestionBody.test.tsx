import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionBody } from './QuestionBody';
import { gradeAnswer, prepareQuestion, type AnswerPayload } from '../lib/questionKinds';
import type { Question } from '../types/question';

/**
 * Sve četiri vrste pitanja imale su testiranu samo logiku (questionKinds.ts),
 * a nijedan test nije provjeravao da se daju odigrati. Ovi testovi idu kroz
 * pravu interakciju - klik po klik, kao igrač.
 */

const single: Question = {
  id: 'test-single', topic: 'sql', unitId: 'osnove-upita', difficulty: 'easy',
  question: 'Što radi WHERE?',
  options: ['Filtrira retke', 'Sortira retke', 'Grupira retke', 'Briše retke'],
  correctIndex: 0,
};

const multi: Question = {
  kind: 'multi',
  id: 'test-multi', topic: 'sql', unitId: 'osnove-upita', difficulty: 'medium',
  question: 'Koje su agregatne funkcije?',
  options: ['COUNT', 'WHERE', 'SUM', 'ORDER BY'],
  correctIndexes: [0, 2],
};

const fill: Question = {
  kind: 'fill',
  id: 'test-fill', topic: 'sql', unitId: 'osnove-upita', difficulty: 'medium',
  question: 'Popuni upit',
  text: 'SELECT ime ___ korisnici ___ dob >= 18;',
  answers: ['FROM', 'WHERE'],
  distractors: ['GROUP', 'HAVING'],
};

const order: Question = {
  kind: 'order',
  id: 'test-order', topic: 'sql', unitId: 'osnove-upita', difficulty: 'hard',
  question: 'Poredaj izvršavanje',
  steps: ['FROM', 'WHERE', 'GROUP BY', 'SELECT'],
};

function renderQuestion(question: Question) {
  const onAnswer = vi.fn();
  const prepared = prepareQuestion(question);
  render(<QuestionBody prepared={prepared} isAnswered={false} onAnswer={onAnswer} questionNumber={1} />);
  return { onAnswer, prepared, user: userEvent.setup() };
}

describe('single choice', () => {
  it('prikazuje sve ponuđene odgovore', () => {
    renderQuestion(single);
    for (const option of single.options as string[]) {
      expect(screen.getByRole('button', { name: new RegExp(option) })).toBeInTheDocument();
    }
  });

  it('klik na odgovor odmah javlja odabir (bez potvrde)', async () => {
    const { onAnswer, user } = renderQuestion(single);
    await user.click(screen.getByRole('button', { name: /Sortira retke/ }));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer.mock.calls[0][0]).toMatchObject({ kind: 'single' });
  });

  it('odabir se ocjenjuje kao točan kad je odabran točan odgovor', async () => {
    const { onAnswer, prepared, user } = renderQuestion(single);
    await user.click(screen.getByRole('button', { name: /Filtrira retke/ }));
    expect(gradeAnswer(prepared, onAnswer.mock.calls[0][0] as AnswerPayload)).toBe(true);
  });

  it('nakon odgovora su svi gumbi onemogućeni', () => {
    render(
      <QuestionBody prepared={prepareQuestion(single)} isAnswered onAnswer={vi.fn()} questionNumber={1} />,
    );
    const group = screen.getByRole('group');
    for (const button of within(group).getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});

describe('multi choice', () => {
  it('potvrda je onemogućena dok ništa nije odabrano', () => {
    renderQuestion(multi);
    expect(screen.getByRole('button', { name: 'Provjeri' })).toBeDisabled();
  });

  it('šalje sve odabrane odgovore odjednom, tek na potvrdu', async () => {
    const { onAnswer, prepared, user } = renderQuestion(multi);
    await user.click(screen.getByRole('button', { name: /COUNT/ }));
    await user.click(screen.getByRole('button', { name: /SUM/ }));
    expect(onAnswer).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Provjeri' }));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(gradeAnswer(prepared, onAnswer.mock.calls[0][0] as AnswerPayload)).toBe(true);
  });

  it('ponovni klik miče odgovor iz odabira', async () => {
    const { onAnswer, prepared, user } = renderQuestion(multi);
    await user.click(screen.getByRole('button', { name: /COUNT/ }));
    await user.click(screen.getByRole('button', { name: /SUM/ }));
    await user.click(screen.getByRole('button', { name: /WHERE/ }));
    await user.click(screen.getByRole('button', { name: /WHERE/ })); // predomislio se
    await user.click(screen.getByRole('button', { name: 'Provjeri' }));
    expect(gradeAnswer(prepared, onAnswer.mock.calls[0][0] as AnswerPayload)).toBe(true);
  });
});

describe('fill in the blank', () => {
  it('potvrda čeka da sve praznine budu popunjene', async () => {
    const { user } = renderQuestion(fill);
    expect(screen.getByRole('button', { name: 'Provjeri' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'FROM' }));
    expect(screen.getByRole('button', { name: 'Provjeri' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'WHERE' }));
    expect(screen.getByRole('button', { name: 'Provjeri' })).toBeEnabled();
  });

  it('riječi se popunjavaju redom i ocjenjuju kao točne', async () => {
    const { onAnswer, prepared, user } = renderQuestion(fill);
    await user.click(screen.getByRole('button', { name: 'FROM' }));
    await user.click(screen.getByRole('button', { name: 'WHERE' }));
    await user.click(screen.getByRole('button', { name: 'Provjeri' }));
    expect(gradeAnswer(prepared, onAnswer.mock.calls[0][0] as AnswerPayload)).toBe(true);
  });

  it('iskorištena riječ nestaje iz banke, a klik na prazninu je vraća', async () => {
    const { user } = renderQuestion(fill);
    const bank = screen.getByRole('group', { name: 'Banka riječi' });
    await user.click(within(bank).getByRole('button', { name: 'FROM' }));
    expect(within(bank).getByRole('button', { name: 'FROM' })).toBeDisabled();

    // Riječ u praznini nosi vlastiti aria-label i vraća se klikom.
    await user.click(screen.getByRole('button', { name: /Praznina 1: FROM/ }));
    expect(within(bank).getByRole('button', { name: 'FROM' })).toBeEnabled();
  });

  it('banka nudi i krive riječi, ne samo točne', () => {
    renderQuestion(fill);
    const bank = screen.getByRole('group', { name: 'Banka riječi' });
    expect(within(bank).getAllByRole('button').length).toBeGreaterThan(
      (fill as { answers: string[] }).answers.length,
    );
  });
});

describe('order steps', () => {
  it('potvrda čeka da svi koraci budu poslagani', async () => {
    const { prepared, user } = renderQuestion(order);
    expect(screen.getByRole('button', { name: 'Provjeri' })).toBeDisabled();
    const steps = (prepared as { shuffledSteps: string[] }).shuffledSteps;
    for (const step of steps.slice(0, -1)) {
      await user.click(screen.getByRole('button', { name: step }));
    }
    expect(screen.getByRole('button', { name: 'Provjeri' })).toBeDisabled();
  });

  it('slaganje točnim redoslijedom se ocjenjuje kao točno', async () => {
    const { onAnswer, prepared, user } = renderQuestion(order);
    for (const step of order.steps as string[]) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^${step}$`) }));
    }
    await user.click(screen.getByRole('button', { name: 'Provjeri' }));
    expect(gradeAnswer(prepared, onAnswer.mock.calls[0][0] as AnswerPayload)).toBe(true);
  });

  it('korak se može izvaditi iz poretka i vratiti u ponudu', async () => {
    const { user } = renderQuestion(order);
    await user.click(screen.getByRole('button', { name: /^FROM$/ }));
    const myOrder = screen.getByRole('list', { name: /Tvoj redoslijed/ });
    expect(within(myOrder).getByText('FROM')).toBeInTheDocument();

    await user.click(within(myOrder).getByRole('button'));
    expect(within(myOrder).queryByText('FROM')).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Preostali koraci' })).getByRole('button', { name: /^FROM$/ }),
    ).toBeInTheDocument();
  });
});

describe('isječak koda', () => {
  it('prikazuje se kad ga pitanje ima', () => {
    renderQuestion({ ...single, id: 'test-code', code: 'SELECT * FROM t;' });
    expect(screen.getByLabelText('Isječak koda uz pitanje')).toHaveTextContent('SELECT * FROM t;');
  });

  it('ne renderira prazan okvir kad pitanje nema kod', () => {
    renderQuestion(single);
    expect(screen.queryByLabelText('Isječak koda uz pitanje')).not.toBeInTheDocument();
  });
});
