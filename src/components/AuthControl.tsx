import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authErrorMessageHr } from '../lib/authErrors';

type AuthMode = 'sign-in' | 'sign-up';

// Supabase poruke su engleske; mapiranje na hrvatski živi u lib/authErrors.ts.
const getAuthErrorMessage = authErrorMessageHr;

export function AuthControl() {
  const { user, isLoading, isCloudEnabled, signUp, signIn, signOut, requestPasswordReset, resendConfirmation, deleteAccount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        // Supabase namjerno vraća uspjeh i za VEĆ POSTOJEĆI email (zaštita od
        // enumeracije), pa poruka mora biti istinita u oba slučaja.
        setNotice('Provjeri email i potvrdi adresu prije prijave. Ako račun već postoji, stiže poveznica za prijavu.');
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

  const handlePasswordReset = async () => {
    const address = email.trim();
    if (!address) {
      setError('Prvo upiši svoj email pa klikni na oporavak lozinke.');
      return;
    }
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await requestPasswordReset(address);
      setNotice('Poslali smo ti poveznicu za novu lozinku. Provjeri poštu (i spam).');
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const address = email.trim();
    if (!address) {
      setError('Prvo upiši svoj email pa zatraži ponovnu potvrdu.');
      return;
    }
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await resendConfirmation(address);
      setNotice('Potvrdna poruka je poslana ponovno. Provjeri poštu (i spam).');
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await deleteAccount();
      setConfirmDelete(false);
      setIsOpen(false);
    } catch (deleteError) {
      setError(getAuthErrorMessage(deleteError));
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

              <div className="mt-5 border-t-2 border-cloud-200 pt-4">
                {confirmDelete ? (
                  <>
                    <p className="text-sm font-bold leading-6 text-rose-800">
                      Trajno obrisati račun i sav napredak? Ovo se ne može poništiti.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="game-button game-button-ghost"
                        onClick={() => setConfirmDelete(false)}
                        disabled={isSubmitting}
                      >
                        Odustani
                      </button>
                      <button
                        type="button"
                        className="min-h-12 rounded-2xl border-2 border-rose-800 bg-rose-600 px-4 font-black text-white shadow-[0_4px_0_#9f1239] transition hover:bg-rose-700 active:translate-y-1 disabled:opacity-60"
                        onClick={handleDeleteAccount}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Brišem…' : 'Obriši'}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="text-xs font-bold text-ink-400 underline decoration-dotted underline-offset-4 transition hover:text-rose-700"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Obriši račun
                  </button>
                )}
              </div>
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

                {/* Bez ovoga korisnik koji zaboravi lozinku ili kojem ne
                    stigne potvrdni mail nema nikakav izlaz iz aplikacije. */}
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 pt-1">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isSubmitting}
                    className="text-xs font-bold text-ink-600 underline decoration-dotted underline-offset-4 transition hover:text-brand-700 disabled:opacity-50"
                  >
                    Zaboravljena lozinka?
                  </button>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isSubmitting}
                    className="text-xs font-bold text-ink-600 underline decoration-dotted underline-offset-4 transition hover:text-brand-700 disabled:opacity-50"
                  >
                    Pošalji potvrdu ponovno
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
