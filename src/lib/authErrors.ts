/**
 * Supabase vraća poruke o greškama na engleskom, a sučelje je hrvatsko.
 * Mapiramo najčešće; nepoznate padaju na generičku poruku umjesto da se
 * korisniku pokaže sirovi engleski tekst iz biblioteke.
 */
const MESSAGES: { match: RegExp; hr: string }[] = [
  { match: /invalid login credentials/i, hr: 'Neispravan e-mail ili lozinka.' },
  { match: /email not confirmed/i, hr: 'E-mail još nije potvrđen. Provjeri poštu (i spam).' },
  { match: /user already registered/i, hr: 'Račun s tim e-mailom već postoji.' },
  { match: /password should be at least/i, hr: 'Lozinka je prekratka (najmanje 6 znakova).' },
  { match: /unable to validate email|invalid email/i, hr: 'E-mail adresa nije ispravna.' },
  { match: /you can only request this after|rate limit|too many requests/i, hr: 'Previše pokušaja. Pričekaj koju minutu pa probaj ponovno.' },
  { match: /new password should be different/i, hr: 'Nova lozinka mora biti različita od stare.' },
  { match: /token has expired|invalid token|expired/i, hr: 'Poveznica je istekla. Zatraži novu.' },
  { match: /failed to fetch|network|load failed/i, hr: 'Nema veze sa serverom. Provjeri internet.' },
];

export function authErrorMessageHr(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  for (const { match, hr } of MESSAGES) {
    if (match.test(raw)) return hr;
  }
  return 'Nešto je pošlo po zlu. Pokušaj ponovno.';
}
