# TODO — sljedeći koraci

## 1. Supabase backend (računi, sinkronizacija, leaderboard, live PvP)

**Status: kod gotov i pushan na `main`, ali neaktivan.** App radi potpuno
normalno u guest/lokalnom modu (localStorage) bez ovoga — ništa nije
blokirano dok se ovo ne napravi, ovo samo uključuje cloud značajke.

Kad budeš spreman/na aktivirati:

1. Kreiraj besplatan projekt na https://supabase.com (ime npr. "techdingo",
   jaka DB lozinka, regija po izboru).
2. U Supabase Dashboardu → SQL Editor → New query, pokreni redom (cijeli
   sadržaj svake datoteke zalijepi i Run):
   - `supabase/migrations/0001_init.sql` (shema, RLS, PvP RPC-ovi)
   - `supabase/seed_questions_meta.sql` (metapodaci pitanja za PvP matchmaking)
3. Project Settings → API → kopiraj **Project URL** i **anon public key**
   (oboje je namijenjeno javnoj upotrebi, nije tajna). Daj ih Claudeu u
   idućoj sesiji, ili sam postavi:
   - lokalno: kopiraj `.env.example` u `.env.local`, upiši vrijednosti
   - GitHub: repo Settings → Secrets and variables → Actions → **Variables**
     tab → dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`

Nakon toga slijedi UI za login/signup, leaderboard i PvP ekrane (još nisu
napravljeni — nema smisla graditi sučelje za backend koji ne postoji).
Arhitektura (shema, RLS politike, matchmaking dizajn, merge-on-login
pravila) je opisana u komentarima unutar `supabase/migrations/0001_init.sql`
i u kodu (`src/state/cloudSync.ts`, `src/state/mergeProgress.ts`,
`src/hooks/useAuth.ts`) — dovoljno da se novi Claude session brzo snađe i
bez pristupa lokalnom plan fileu s ovog računala.

## 2. Redizajn i rast baze pitanja (u tijeku)

Codex (drugi AI agent, radi paralelno na istom repou) radi na vizualnom
redizajnu i širenju baze pitanja prema cilju 100+ po temi. Zadnje poznato
stanje (vidi git log za točan napredak): SQL 74, Frontend 75, Backend 47,
Opće 25 = 221 pitanje ukupno kroz 4 teme.

Detaljna koordinacijska povijest (tko je što radio, otvorena pitanja) živi
u `AGENT_NOTES.txt` u rootu repozitorija — namjerno NIJE u gitu (vidi
`.gitignore`), postoji samo lokalno na računalu gdje je nastala. Ako
nastavljaš s drugog laptopa, ta datoteka neće postojati dok je Codex ili
Claude ponovno ne kreiraju na tom računalu.

## 3. Linkovi

- Repo: https://github.com/VilimTrakos/techdingo
- Live app: https://vilimtrakos.github.io/techdingo/
