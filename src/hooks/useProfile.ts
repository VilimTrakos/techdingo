import { withTimeout } from '../lib/withTimeout';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../state/supabaseClient';
import { useAuth } from './useAuth';

export const DISPLAY_NAME_MIN = 3;
export const DISPLAY_NAME_MAX = 24;

interface ProfileState {
  displayName: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Profil prijavljenog korisnika (public.profiles). display_name je javno
 * vidljiv na ljestvici i u PvP-u - default "Player-<id>" postavlja DB
 * trigger pri registraciji, ovdje ga korisnik mijenja.
 */
export function useProfile() {
  const { user } = useAuth();
  const [state, setState] = useState<ProfileState>({
    displayName: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!supabase || !user) {
      setState({ displayName: null, isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // async/await umjesto .then/.catch: Supabase builder je PromiseLike, nema
    // .catch. Bez try/catch mrežni pad ostavlja isLoading zauvijek na true.
    void (async () => {
      try {
        const { data, error } = await withTimeout(
          supabase!.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
          'dohvat profila',
        );
        if (cancelled) return;
        setState({
          displayName: (data?.display_name as string | undefined) ?? null,
          isLoading: false,
          error: error?.message ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        console.warn('techdingo: dohvat profila nije uspio.', err);
        setState({ displayName: null, isLoading: false, error: 'Nije moguće dohvatiti profil.' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateDisplayName = useCallback(
    async (rawName: string): Promise<void> => {
      if (!supabase || !user) throw new Error('Nisi prijavljen.');
      const name = rawName.trim();
      if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
        throw new Error(`Ime mora imati ${DISPLAY_NAME_MIN}-${DISPLAY_NAME_MAX} znakova.`);
      }
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', user.id);
      if (error) throw new Error(error.message);
      setState((prev) => ({ ...prev, displayName: name }));
    },
    [user],
  );

  return {
    displayName: state.displayName,
    isLoading: state.isLoading,
    error: state.error,
    updateDisplayName,
    isSignedIn: user !== null,
  };
}
