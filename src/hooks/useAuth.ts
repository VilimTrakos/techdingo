import { useCallback, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../state/supabaseClient';
import { setCurrentUserId } from '../state/authUserRef';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  /** Poruka kad ni sesiju nismo uspjeli pročitati (npr. offline). */
  error: string | null;
}

let state: AuthState = { session: null, isLoading: supabase !== null, error: null };
const listeners = new Set<() => void>();

function setState(next: AuthState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AuthState {
  return state;
}

// Pokreće se jednom, kad se modul prvi put importa (isti obrazac kao
// useProgress.ts) - ne unutar hooka, da izbjegnemo dupliciranje pretplate
// pri svakom renderu/StrictMode double-invoke.
if (supabase) {
  supabase.auth
    .getSession()
    .then(({ data }) => {
      setState({ session: data.session, isLoading: false, error: null });
      setCurrentUserId(data.session?.user.id ?? null);
    })
    .catch((err) => {
      // Bez ovog .catch-a mrežni pad ostavlja isLoading zauvijek na true,
      // pa se panel računa nikad ne otvori i korisnik nema nikakvu poruku.
      console.warn('techdingo: čitanje sesije nije uspjelo.', err);
      setState({ session: null, isLoading: false, error: 'Nije moguće dohvatiti sesiju. Provjeri internetsku vezu.' });
    });

  supabase.auth.onAuthStateChange((_event, session) => {
    setState({ session, isLoading: false, error: null });
    setCurrentUserId(session?.user.id ?? null);
  });
}

/**
 * Apsolutni URL unutar aplikacije za Supabase preusmjeravanja.
 * `BASE_URL` pokriva GitHub Pages podputanju ('/techdingo/'), a '#' HashRouter.
 * Svaki ovdje generiran URL mora biti i na Redirect URLs popisu u Supabase
 * dashboardu, inače Supabase odbije preusmjeravanje.
 */
function appUrl(hashPath: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#${hashPath}`;
}

export function useAuth() {
  const { session, isLoading, error } = useSyncExternalStore(subscribe, getSnapshot);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    // emailRedirectTo eksplicitno: bez njega odredište ovisi samo o Site URL-u
    // u dashboardu, što je krhko uz HashRouter + GitHub Pages podputanju.
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: appUrl('/') },
    });
    if (signUpError) throw signUpError;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  /** Šalje mail s poveznicom za postavljanje nove lozinke. */
  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl('/auth/recovery'),
    });
    if (resetError) throw resetError;
  }, []);

  /** Postavlja novu lozinku za trenutno prijavljenu (ili recovery) sesiju. */
  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) throw updateError;
  }, []);

  /** Ponovno šalje potvrdu registracije ako prvi mail nije stigao. */
  const resendConfirmation = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: appUrl('/') },
    });
    if (resendError) throw resendError;
  }, []);

  return {
    user: session?.user ?? null,
    isLoading,
    error,
    isCloudEnabled: supabase !== null,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    resendConfirmation,
  };
}
