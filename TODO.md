# TODO — sljedeći koraci

## 1. Supabase backend (računi, sinkronizacija, leaderboard, live PvP)

**Status: ŽIVO i verificirano (2026-08-22).** Migracija `0001_init.sql` i
`supabase/seed_questions_meta.sql` su pokrenuti na pravom Supabase
projektu, `.env.local` i GitHub repo Variables su postavljeni, i cijeli
tok (signup → email potvrda → login → profil trigger → RLS na
`progress` → `join_pvp_queue` RPC) je end-to-end testiran i radi.

Što **NE** postoji još:
- Login/signup UI u samoj appi (backend hookovi postoje: `useAuth.ts`,
  `cloudSync.ts`, `mergeProgress.ts` — treba samo sučelje protiv njih).
- `useLeaderboard` hook + leaderboard UI (Faza C).
- `usePvpMatch` hook + PvP lobby/duel UI (Faza D).
- Realtime Authorization za PvP broadcast (`supabase/migrations/0002_pvp_realtime_authorization.sql`,
  namjerno označen "NE POKREĆI JOŠ" — prvi pokušaj je pukao s
  "must be owner of table messages" na hostanom Supabaseu, treba
  provjeriti trenutnu Supabase dokumentaciju za ispravan pristup prije
  pokretanja).

Poznato: prilikom testiranja je nastao jedan test korisnik
(`Player-6f8f051f...`, email `vilimtrakostanec+techdingo-smoke-...@gmail.com`)
i jedan test `progress` red u produkcijskom projektu — bezopasno, ali može
se obrisati preko Dashboard → Authentication → Users ako se želi čist popis.

Arhitektura (shema, RLS politike, matchmaking dizajn, merge-on-login
pravila) je opisana u komentarima unutar `supabase/migrations/0001_init.sql`
i u kodu (`src/state/cloudSync.ts`, `src/state/mergeProgress.ts`,
`src/hooks/useAuth.ts`).

## 2. Redizajn i rast baze pitanja (u tijeku)

Codex (drugi AI agent, radi paralelno na istom repou) radi na vizualnom
redizajnu i širenju baze pitanja prema cilju 100+ po temi. Trenutno stanje
(2026-08-22, nakon integracije svih do sad primljenih Codex batcheva):
**SQL 100, Frontend 100, Backend 73, Opće 50 = 323 pitanja ukupno.**
SQL i Frontend su dosegli cilj od 100+; Backend i Opće još trebaju rasti.

Detaljna koordinacijska povijest (tko je što radio, otvorena pitanja) živi
u `AGENT_NOTES.txt` u rootu repozitorija — namjerno NIJE u gitu (vidi
`.gitignore`), postoji samo lokalno na računalu gdje je nastala. Ako
nastavljaš s drugog laptopa, ta datoteka neće postojati dok je Codex ili
Claude ponovno ne kreiraju na tom računalu.

Napomena: kad se u toj bilježnici pojavi novi ```json blok pitanja od
Codexa, integracijski postupak je: parsiraj blokove, spoji po `id` (dedupe)
u odgovarajuću `src/data/questions/<tema>.json`, sortiraj easy→medium→hard,
pokreni `npm run validate:questions`, regeneriraj
`supabase/seed_questions_meta.sql` (`npx tsx scripts/generate-question-metadata-seed.ts`).

## 3. Spaced repetition (još nije započeto)

Korisnik je eksplicitno tražio da se pitanja lagano ponavljaju kroz lekcije
radi pamćenja (Duolingo stil), odvojeno od difficulty-ordering rada koji je
već gotov. Treba dizajnirati i implementirati u `src/lib/pool.ts` /
`src/state/progress.ts` — nije počelo.

## 4. Linkovi

- Repo: https://github.com/VilimTrakos/techdingo
- Live app: https://vilimtrakos.github.io/techdingo/
