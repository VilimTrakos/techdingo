import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../state/supabaseClient';

export interface LeaderboardEntry {
  displayName: string;
  bestScore: number;
}

interface State {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

const LEADERBOARD_LIMIT = 20;

export function useLeaderboard(topicId: string) {
  const [state, setState] = useState<State>({ entries: [], isLoading: supabase !== null, error: null });
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setState({ entries: [], isLoading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    supabase
      .from('leaderboard')
      .select('display_name, best_score')
      .eq('topic_id', topicId)
      .order('best_score', { ascending: false })
      .limit(LEADERBOARD_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ entries: [], isLoading: false, error: error.message });
          return;
        }
        setState({
          entries: (data ?? []).map((row) => ({
            displayName: row.display_name as string,
            bestScore: row.best_score as number,
          })),
          isLoading: false,
          error: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [topicId, refreshNonce]);

  const refresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  return {
    entries: state.entries,
    isLoading: state.isLoading,
    error: state.error,
    isCloudEnabled: supabase !== null,
    refresh,
  };
}
