import { useCallback, useSyncExternalStore } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../state/supabaseClient';
import { setCurrentUserId } from '../state/authUserRef';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
}

let state: AuthState = { session: null, isLoading: supabase !== null };
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
  supabase.auth.getSession().then(({ data }) => {
    setState({ session: data.session, isLoading: false });
    setCurrentUserId(data.session?.user.id ?? null);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    setState({ session, isLoading: false });
    setCurrentUserId(session?.user.id ?? null);
  });
}

export function useAuth() {
  const { session, isLoading } = useSyncExternalStore(subscribe, getSnapshot);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Cloud značajke nisu konfigurirane.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    user: session?.user ?? null,
    isLoading,
    isCloudEnabled: supabase !== null,
    signUp,
    signIn,
    signOut,
  };
}
