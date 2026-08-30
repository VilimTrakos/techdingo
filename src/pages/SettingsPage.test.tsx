import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Reset napretka je jedina nepovratna radnja koju korisnik može pokrenuti sam,
 * i jedina koja kad je prijavljen briše i podatke u oblaku. Zato je pokrivena
 * potvrda, odustajanje, i to da srca preživljavaju.
 */
const STORAGE_KEY = 'techdingo:progress:v1';

function seed(xp = 500, hearts = 3) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 4,
    xpTotal: xp,
    streak: { current: 7, longest: 9, lastCompletedDateISO: null },
    lessons: { 'sql/osnove-upita': { passCount: 2, failCount: 0, recentQuestionIds: [], struggledQuestionIds: [] } },
    scoreStrike: {},
    mastery: {},
    lessonCounter: 2,
    hearts: { balance: hearts, lastRegenAtISO: new Date().toISOString() },
    dailyChallenge: { lastPlayedDateISO: null, lastScore: 0, bestScore: 0 },
    updatedAtISO: new Date().toISOString(),
  }));
}

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

async function renderSettings({ signedIn = false } = {}) {
  vi.resetModules();
  vi.doMock('../hooks/useAuth', () => ({
    useAuth: () => ({
      user: signedIn ? { id: 'u1' } : null,
      isLoading: false,
      error: null,
      isCloudEnabled: signedIn,
    }),
  }));
  const { SettingsPage } = await import('./SettingsPage');
  render(<MemoryRouter><SettingsPage /></MemoryRouter>);
  return { user: userEvent.setup({ delay: null }) };
}

beforeEach(() => vi.resetModules());

describe('SettingsPage', () => {
  it('prikazuje trenutni napredak', async () => {
    seed(500, 3);
    await renderSettings();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('brisanje traži potvrdu, ne briše na prvi klik', async () => {
    seed(500);
    const { user } = await renderSettings();
    await user.click(screen.getByRole('button', { name: 'Obriši napredak' }));

    expect(screen.getByText(/ne može poništiti/i)).toBeInTheDocument();
    expect(stored().xpTotal).toBe(500);
  });

  it('odustajanje ostavlja napredak netaknut', async () => {
    seed(500);
    const { user } = await renderSettings();
    await user.click(screen.getByRole('button', { name: 'Obriši napredak' }));
    await user.click(screen.getByRole('button', { name: 'Odustani' }));

    expect(stored().xpTotal).toBe(500);
    expect(screen.getByRole('button', { name: 'Obriši napredak' })).toBeInTheDocument();
  });

  it('potvrda briše XP i niz', async () => {
    seed(500);
    const { user } = await renderSettings();
    await user.click(screen.getByRole('button', { name: 'Obriši napredak' }));
    await user.click(screen.getByRole('button', { name: 'Da, obriši napredak' }));

    await waitFor(() => expect(stored().xpTotal).toBe(0));
    expect(stored().streak.current).toBe(0);
    expect(stored().lessons).toEqual({});
    expect(screen.getByRole('status')).toHaveTextContent('Napredak je obrisan');
  });

  it('srca NE preživljavaju kao refill - reset ih ne puni', async () => {
    // Da reset puni srca, brisanje napretka bilo bi besplatan način
    // zaobilaženja ekonomije srca.
    seed(500, 2);
    const { user } = await renderSettings();
    await user.click(screen.getByRole('button', { name: 'Obriši napredak' }));
    await user.click(screen.getByRole('button', { name: 'Da, obriši napredak' }));

    await waitFor(() => expect(stored().xpTotal).toBe(0));
    expect(stored().hearts.balance).toBe(2);
  });

  it('prijavljenom korisniku kaže da se briše i u oblaku', async () => {
    seed();
    await renderSettings({ signedIn: true });
    expect(screen.getByText(/briše se i spremljeno u oblaku/i)).toBeInTheDocument();
  });

  it('odjavljenom kaže da je brisanje samo na ovom uređaju', async () => {
    seed();
    await renderSettings({ signedIn: false });
    expect(screen.getByText(/samo na ovom uređaju/i)).toBeInTheDocument();
  });
});
