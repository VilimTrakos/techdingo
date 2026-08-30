import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * AuthControl je jedini put do računa: prijava, registracija, oporavak
 * lozinke, ponovno slanje potvrde i brisanje računa. Do sad nije imao nijedan
 * test — ako pukne, nitko se ne može prijaviti, a ništa to ne bi javilo.
 *
 * `useAuth` je mockan jer nas ovdje zanima ponašanje sučelja, ne Supabase.
 */
type AuthOverrides = Partial<Record<string, unknown>>;

const spies = {
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  resendConfirmation: vi.fn(),
  deleteAccount: vi.fn(),
};

async function renderAuth(overrides: AuthOverrides = {}) {
  vi.resetModules();
  for (const s of Object.values(spies)) s.mockReset().mockResolvedValue(undefined);
  vi.doMock('../hooks/useAuth', () => ({
    useAuth: () => ({
      user: null,
      isLoading: false,
      error: null,
      isCloudEnabled: true,
      ...spies,
      ...overrides,
    }),
  }));
  const { AuthControl } = await import('./AuthControl');
  render(<AuthControl />);
  // delay: null - bez toga userEvent između svakog znaka prepušta event loop,
  // pa je tipkanje e-maila i lozinke trošilo preko 5 s i testovi su padali na
  // timeout u otprilike četiri od pet pokretanja.
  return userEvent.setup({ delay: null });
}

/** Panel je zatvoren dok se ne klikne gumb u zaglavlju. */
async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: /Prijava/ })[0]);
}

beforeEach(() => vi.resetModules());

describe('AuthControl — bez clouda', () => {
  it('ne renderira ništa ako cloud nije konfiguriran', async () => {
    await renderAuth({ isCloudEnabled: false });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('AuthControl — prijava', () => {
  it('panel je zatvoren dok se ne klikne', async () => {
    await renderAuth();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
  });

  it('prijava šalje upisani email i lozinku', async () => {
    const user = await renderAuth();
    await openPanel(user);
    await user.type(screen.getByLabelText('Email'), 'ti@primjer.hr');
    await user.type(screen.getByLabelText('Lozinka'), 'tajna123');
    await user.click(screen.getByRole('button', { name: 'Prijavi se' }));

    expect(spies.signIn).toHaveBeenCalledWith('ti@primjer.hr', 'tajna123');
  });

  it('prazna polja ne šalju zahtjev (HTML validacija drži formu)', async () => {
    const user = await renderAuth();
    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'Prijavi se' }));
    expect(spies.signIn).not.toHaveBeenCalled();
  });

  it('greška iz Supabasea se prikazuje NA HRVATSKOM', async () => {
    const user = await renderAuth();
    spies.signIn.mockRejectedValue(new Error('Invalid login credentials'));
    await openPanel(user);
    await user.type(screen.getByLabelText('Email'), 'ti@primjer.hr');
    await user.type(screen.getByLabelText('Lozinka'), 'krivo123');
    await user.click(screen.getByRole('button', { name: 'Prijavi se' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).not.toMatch(/Invalid login credentials/);
    expect(alert.textContent).toMatch(/[čćšđž]|lozink|podac/i);
  });
});

describe('AuthControl — registracija', () => {
  it('poruka nakon registracije je istinita i kad račun već postoji', async () => {
    // Supabase namjerno vraća uspjeh i za postojeći email (zaštita od
    // enumeracije), pa poruka ne smije tvrditi da je račun kreiran.
    const user = await renderAuth();
    await openPanel(user);
    await user.click(screen.getByRole('tab', { name: 'Novi račun' }));
    await user.type(screen.getByLabelText('Email'), 'ti@primjer.hr');
    await user.type(screen.getByLabelText('Lozinka'), 'tajna123');
    await user.click(screen.getByRole('button', { name: 'Kreiraj račun' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/Provjeri email/i);
    expect(status.textContent).not.toMatch(/Račun je kreiran/i);
  });
});

describe('AuthControl — izlazi za zaglavljenog korisnika', () => {
  it('oporavak lozinke traži email prije slanja', async () => {
    const user = await renderAuth();
    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'Zaboravljena lozinka?' }));

    expect(spies.requestPasswordReset).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Prvo upiši svoj email/i);
  });

  it('oporavak lozinke šalje zahtjev kad email postoji', async () => {
    const user = await renderAuth();
    await openPanel(user);
    await user.type(screen.getByLabelText('Email'), 'ti@primjer.hr');
    await user.click(screen.getByRole('button', { name: 'Zaboravljena lozinka?' }));

    expect(spies.requestPasswordReset).toHaveBeenCalledWith('ti@primjer.hr');
    expect(await screen.findByRole('status')).toHaveTextContent(/poveznicu za novu lozinku/i);
  });

  it('ponovno slanje potvrde radi isto', async () => {
    const user = await renderAuth();
    await openPanel(user);
    await user.type(screen.getByLabelText('Email'), 'ti@primjer.hr');
    await user.click(screen.getByRole('button', { name: 'Pošalji potvrdu ponovno' }));

    expect(spies.resendConfirmation).toHaveBeenCalledWith('ti@primjer.hr');
  });
});

describe('AuthControl — prijavljen korisnik', () => {
  const signedIn = { user: { id: 'u1', email: 'ti@primjer.hr' } };

  it('nudi odjavu', async () => {
    const user = await renderAuth(signedIn);
    await user.click(screen.getAllByRole('button', { name: /Moj račun/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Odjavi se' }));
    expect(spies.signOut).toHaveBeenCalledOnce();
  });

  it('brisanje računa traži potvrdu, ne briše na prvi klik', async () => {
    const user = await renderAuth(signedIn);
    await user.click(screen.getAllByRole('button', { name: /Moj račun/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Obriši račun' }));

    expect(spies.deleteAccount).not.toHaveBeenCalled();
    expect(screen.getByText(/ne može poništiti/i)).toBeInTheDocument();
  });

  it('potvrda briše račun', async () => {
    const user = await renderAuth(signedIn);
    await user.click(screen.getAllByRole('button', { name: /Moj račun/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Obriši račun' }));
    await user.click(screen.getByRole('button', { name: 'Obriši' }));

    expect(spies.deleteAccount).toHaveBeenCalledOnce();
  });
});
