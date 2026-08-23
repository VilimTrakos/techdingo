import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { loadTopicQuestions } from '../data/questionLoader';
import { questionKind, type Question } from '../types/question';

/**
 * Integracijski test cijele petlje lekcije: pitanja stižu asinkrono (chunk po
 * temi), prikazuju se, odgovaraju i troše srca. Ovo je jedini test koji
 * pokriva to spajanje - dohvat, reducer, srca i UI zajedno.
 *
 * Koristi PRAVU banku pitanja, bez mockova: upravo je asinkroni dohvat ono
 * što se htjelo dokazati.
 */

const STORAGE_KEY = 'techdingo:progress:v1';
let bank: Question[];

function seedProgress(hearts: number): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 4,
    xpTotal: 0,
    streak: { current: 0, longest: 0, lastCompletedDateISO: null },
    lessons: {},
    scoreStrike: {},
    mastery: {},
    lessonCounter: 0,
    hearts: { balance: hearts, lastRegenAtISO: new Date().toISOString() },
    dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
    updatedAtISO: new Date().toISOString(),
  }));
}

/**
 * Progress store je modul-singleton koji localStorage čita JEDNOM, pri importu.
 * Bez resetModules() bi drugi test u datoteci naslijedio srca iz prvog, pa
 * `seedProgress(0)` ne bi imao nikakav učinak - stranica bi svejedno krenula.
 * Zato se stranica uvozi tek nakon što je stanje posijano.
 */
/** Trajna zaliha srca, onako kako je spremljena - ne kako je prikazana. */
function storedHearts(): number {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').hearts?.balance;
}

async function renderLesson(path = '/lesson/sql/osnove-upita') {
  vi.resetModules();
  const { LessonPage } = await import('./LessonPage');
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lesson/:topicId/:unitId" element={<LessonPage />} />
        <Route path="/topic/:topicId" element={<p>put učenja</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return { user: userEvent.setup() };
}

/** Odgovara na trenutno prikazano pitanje - točno ili namjerno krivo. */
async function answerCurrent(user: ReturnType<typeof userEvent.setup>, correctly: boolean) {
  const heading = await screen.findByRole('heading', { level: 1 });
  const question = bank.find((q) => q.question === heading.textContent);
  if (!question) throw new Error(`Pitanje nije nađeno u banci: ${heading.textContent}`);

  const confirm = () => user.click(screen.getByRole('button', { name: 'Provjeri' }));
  const clickExact = (label: string) =>
    user.click(screen.getByRole('button', { name: new RegExp(`^${escapeRe(label)}$`) }));

  switch (questionKind(question)) {
    case 'single': {
      const { options, correctIndex } = question as Extract<Question, { correctIndex: number }>;
      const wanted = correctly ? options[correctIndex] : options[(correctIndex + 1) % options.length];
      await user.click(screen.getByRole('button', { name: wanted }));
      return;
    }
    case 'multi': {
      const { options, correctIndexes } = question as Extract<Question, { correctIndexes: number[] }>;
      const targets = correctly
        ? correctIndexes.map((i) => options[i])
        : options.filter((_, i) => !correctIndexes.includes(i)).slice(0, 1);
      for (const target of targets) await user.click(screen.getByRole('button', { name: target }));
      return confirm();
    }
    case 'fill': {
      const { answers } = question as Extract<Question, { answers: string[] }>;
      const wordBank = screen.getByRole('group', { name: 'Banka riječi' });
      const words = correctly ? answers : [...answers].reverse();
      for (const word of words) {
        await user.click(within(wordBank).getByRole('button', { name: word }));
      }
      return confirm();
    }
    case 'order': {
      const { steps } = question as Extract<Question, { steps: string[] }>;
      for (const step of correctly ? steps : [...steps].reverse()) await clickExact(step);
      return confirm();
    }
  }
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

beforeEach(async () => {
  bank = await loadTopicQuestions('sql');
});

describe('LessonPage', () => {
  it('pitanja stižu asinkrono i lekcija se pokrene', async () => {
    seedProgress(5);
    await renderLesson();
    // Prvo se vidi priprema, pa tek onda pitanje - dohvat je asinkron.
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.queryByText('Pripremamo tvoju lekciju…')).not.toBeInTheDocument();
  });

  it('prikazuje pitanja iz TRAŽENE cjeline, ne iz cijele teme', async () => {
    seedProgress(5);
    await renderLesson();
    const heading = await screen.findByRole('heading', { level: 1 });
    const shown = bank.find((q) => q.question === heading.textContent);
    expect(shown?.unitId).toBe('osnove-upita');
  });

  it('prva lekcija u cjelini počinje uvodnim pitanjem', async () => {
    seedProgress(5);
    await renderLesson();
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(bank.find((q) => q.question === heading.textContent)?.isIntro).toBe(true);
  });

  it('točan odgovor ne troši srce i nudi nastavak', async () => {
    seedProgress(5);
    const { user } = await renderLesson();
    await screen.findByRole('heading', { level: 1 });
    await answerCurrent(user, true);

    expect(await screen.findByRole('button', { name: /Nastavi|Idemo dalje/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Preostala srca: 5/)).toBeInTheDocument();
  });

  it('krivi odgovor troši srce IZ TRAJNE zalihe, ne samo s prikaza', async () => {
    // Brojač u zaglavlju vodi reducer i pao bi i da se zaliha ne dira. Srca su
    // trajna (vrijede i nakon lekcije), pa se provjerava ono što se sprema.
    seedProgress(5);
    const { user } = await renderLesson();
    await screen.findByRole('heading', { level: 1 });
    await answerCurrent(user, false);

    await waitFor(() => expect(storedHearts()).toBe(4));
    expect(screen.getByLabelText(/Preostala srca: 4/)).toBeInTheDocument();
  });

  it('točan odgovor ne dira trajnu zalihu srca', async () => {
    seedProgress(5);
    const { user } = await renderLesson();
    await screen.findByRole('heading', { level: 1 });
    await answerCurrent(user, true);

    await screen.findByRole('button', { name: /Nastavi|Idemo dalje/ });
    expect(storedHearts()).toBe(5);
  });

  it('bez srca lekcija ne kreće nego nudi ekran srca', async () => {
    seedProgress(0);
    await renderLesson();
    // HeartsGate umjesto pitanja - i nijedno pitanje se ne smije prikazati.
    await waitFor(() =>
      expect(screen.queryByText('Pripremamo tvoju lekciju…')).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('group', { name: /Ponuđeni odgovori/ })).not.toBeInTheDocument();
  });

  it('nepoznata tema daje poruku, ne prazan ekran', async () => {
    seedProgress(5);
    await renderLesson('/lesson/ne-postoji/neka-cjelina');
    expect(await screen.findByRole('heading', { name: 'Tema nije pronađena' })).toBeInTheDocument();
  });
});
