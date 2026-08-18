import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * `null` kad env varijable nisu postavljene (lokalni dev bez .env.local,
 * fork-PR CI build). Svaki potrošač MORA tretirati `null` kao "cloud
 * značajke isključene" - app mora ostati potpuno funkcionalna u guest
 * (samo-lokalnom) modu bez ijednog mrežnog poziva.
 *
 * `flowType: 'pkce'` je namjeran: app koristi HashRouter (vidi main.tsx), a
 * Supabase-ov zadani implicit flow vraća sesiju kao `#access_token=...` hash
 * fragment koji bi se sudario s HashRouter-ovim korištenjem `#` za rute.
 * PKCE flow koristi `?code=` query param i zaobilazi taj sudar.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { flowType: 'pkce' } }) : null;
