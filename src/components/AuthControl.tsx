import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'sign-in' | 'sign-up';

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Nešto je pošlo po zlu. Pokušaj ponovno.';
}

export function AuthControl() {
  const { user, isLoading, isCloudEnabled, signUp, signIn, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [isOpen]);

  if (!isCloudEnabled) return null;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === 'sign-up') {
        await signUp(email.trim(), password);
        setPassword('');
        setNotice('Račun je kreiran. Provjeri email i potvrdi adresu prije prijave.');
      } else {
        await signIn(email.trim(), password);
        setPassword('');
        setIsOpen(false);
      }
    } catch (submitError) {
      setError(getAuthErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signOut();
      setIsOpen(false);
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={panelRef} className="relative ml-1">
      <button
        type="button"
        className="flex min-h-10 items-center gap-2 rounded-xl border-2 border-cloud-200 bg-white px-3 py-2 text-sm font-black text-ink-800 shadow-[0_2px_0_#bdc9b8] transition hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 disabled:cursor-wait disabled:opacity-60"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isLoading}
      >
        <span aria-hidden="true">{user ? '●' : '♙'}</span>
        <span className="hidden min-[620px]:inline">
          {isLoading ? 'Učitavanje…' : user ? 'Moj račun' : 'Prijava'}
        </span>
        <span className="sr-only min-[620px]:hidden">
          {user ? 'Moj račun' : 'Prijava'}
        </span>
      </button>

      {isOpen && !isLoading && (
        <section
          role="dialog"
          aria-label={user ? 'Moj račun' : 'Prijava ili registracija'}
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] animate-pop-in rounded-2xl border-2 border-cloud-200 bg-white p-5 shadow-[0_6px_0_#cbd5c6,0_20px_50px_rgba(23,32,42,0.18)]"
        >
          {user ? (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-brand-700">
                Prijavljen si
              </p>
              <p className="mt-2 truncate text-base font-black text-ink-950">{user.email}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-ink-600">
                Tvoj napredak automatski se sinkronizira s računom.
              </p>
              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}
              <button
                type="button"
                className="game-button game-button-ghost mt-5 w-full"
                onClick={handleSignOut}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Odjava…' : 'Odjavi se'}
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-cloud-100 p-1" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'sign-in'}
                  className={`rounded-lg px-3 py-2 text-sm font-black transition ${
                    mode === 'sign-in'
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-600 hover:text-ink-950'
                  }`}
                  onClick={() => switchMode('sign-in')}
                >
                  Prijava
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'sign-up'}
                  className={`rounded-lg px-3 py-2 text-sm font-black transition ${
                    mode === 'sign-up'
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-600 hover:text-ink-950'
                  }`}
                  onClick={() => switchMode('sign-up')}
                >
                  Novi račun
                </button>
              </div>

              <h2 className="mt-5 text-xl font-black text-ink-950">
                {mode === 'sign-in' ? 'Nastavi gdje si stao' : 'Spremi svoj napredak'}
              </h2>
              <p className="mt-1 text-sm font-bold leading-6 text-ink-600">
                {mode === 'sign-in'
                  ? 'Prijavi se i sinkroniziraj XP, niz i rezultate.'
                  : 'Otvori besplatan račun putem email adrese.'}
              </p>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor={emailId} className="text-sm font-black text-ink-800">
                    Email
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border-2 border-cloud-200 bg-cloud-50 px-3 py-2.5 font-bold text-ink-950 transition placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none"
                    placeholder="ti@primjer.hr"
                  />
                </div>
                <div>
                  <label htmlFor={passwordId} className="text-sm font-black text-ink-800">
                    Lozinka
                  </label>
                  <input
                    id={passwordId}
                    type="password"
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border-2 border-cloud-200 bg-cloud-50 px-3 py-2.5 font-bold text-ink-950 transition placeholder:text-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none"
                    placeholder="Najmanje 6 znakova"
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold leading-5 text-brand-800">
                    {notice}
                  </p>
                )}

                <button
                  type="submit"
                  className="game-button game-button-primary w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Pričekaj…'
                    : mode === 'sign-in'
                      ? 'Prijavi se'
                      : 'Kreiraj račun'}
                </button>
              </form>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
