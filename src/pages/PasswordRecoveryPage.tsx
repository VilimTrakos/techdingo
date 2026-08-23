import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authErrorMessageHr } from '../lib/authErrors';

const MIN_PASSWORD_LENGTH = 6;

/**
 * Odredište poveznice iz maila za oporavak lozinke.
 * Supabase je do dolaska ovamo već razmijenio `?code=` za recovery sesiju
 * (detectSessionInUrl + PKCE), pa je korisnik ovdje privremeno prijavljen i
 * `updateUser({ password })` smije proći. Ako sesije nema, poveznica je
 * istekla ili je već iskorištena.
 */
export function PasswordRecoveryPage() {
  const { user, isLoading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Lozinka mora imati barem ${MIN_PASSWORD_LENGTH} znakova.`);
      return;
    }
    if (password !== confirm) {
      setError('Lozinke se ne podudaraju.');
      return;
    }
    setStatus('saving');
    setError('');
    try {
      await updatePassword(password);
      setStatus('done');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setStatus('idle');
      setError(authErrorMessageHr(err));
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[45vh] max-w-xl items-center justify-center" role="status">
        <p className="font-bold text-ink-600">Provjeravamo poveznicu…</p>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="mx-auto max-w-md rounded-[2rem] border-2 border-brand-200 bg-white p-8 text-center shadow-[0_6px_0_#b8efc1]">
        <p className="text-5xl" aria-hidden="true">✅</p>
        <h1 className="mt-4 text-2xl font-black text-ink-950">Lozinka je promijenjena!</h1>
        <p className="mt-3 font-medium text-ink-600">Vraćamo te na početnu…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md rounded-[2rem] border-2 border-rose-200 bg-white p-8 text-center shadow-[0_6px_0_#fecdd3]">
        <p className="text-5xl" aria-hidden="true">⏳</p>
        <h1 className="mt-4 text-2xl font-black text-ink-950">Poveznica više ne vrijedi</h1>
        <p className="mt-3 font-medium leading-7 text-ink-600">
          Poveznica za oporavak lozinke je istekla ili je već iskorištena.
          Zatraži novu preko gumba za prijavu u zaglavlju.
        </p>
        <Link to="/" className="game-button game-button-primary mt-6 px-6 py-3">
          Natrag na početnu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border-2 border-cloud-200 bg-white p-8 shadow-card">
      <h1 className="text-2xl font-black text-ink-950">Postavi novu lozinku</h1>
      <p className="mt-2 text-sm font-semibold leading-6 text-ink-600">
        Prijavljen si kao <strong className="font-black">{user.email}</strong>.
        Odaberi novu lozinku za svoj račun.
      </p>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        <label className="block">
          <span className="block text-xs font-black uppercase tracking-wider text-ink-600">
            Nova lozinka
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            className="mt-1.5 w-full rounded-xl border-2 border-cloud-200 bg-white px-3 py-2.5 font-bold text-ink-950 outline-none transition focus:border-brand-300"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-black uppercase tracking-wider text-ink-600">
            Ponovi lozinku
          </span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            className="mt-1.5 w-full rounded-xl border-2 border-cloud-200 bg-white px-3 py-2.5 font-bold text-ink-950 outline-none transition focus:border-brand-300"
          />
        </label>

        {error && (
          <p className="text-sm font-bold text-rose-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="game-button game-button-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'saving' ? 'Spremam…' : 'Spremi novu lozinku'}
        </button>
      </form>
    </div>
  );
}

export default PasswordRecoveryPage;
