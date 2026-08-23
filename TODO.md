# TODO — sljedeći koraci

## 0. Duolingo restruktura (2026-08-22) — NAPRAVLJENO, u polish fazi

Veliki krug po korisnikovom feedbacku, sve pushano i smoke-testirano:
- Podteme/"units" (`src/data/units.ts`): tema → 6-10 cjelina, otključavanje
  redom, vlastiti put po temi (`#/topic/:id`), kratke unit lekcije
  (`#/lesson/:topicId/:unitId`, 8-10 pitanja s ponavljanjem).
- Trajna srca (ProgressStateV2): globalna zaliha 5, regen 1/4h (lijeno,
  `src/state/hearts.ts`), tvrdi gate za lekcije (HeartsGate: countdown,
  stub reklama +1 ♥, testni refill). Srca/daily su device-local (ne syncaju).
- 4 vrste pitanja: single (+opcionalni `code` blok), multi, fill (word
  bank), order. `lib/questionKinds.ts` = prep/grade; `QuestionBody.tsx` =
  render. Sheme objavljene Codexu u AGENT_NOTES.txt.
- Spaced repetition light: krivi odgovori → `struggledQuestionIds` →
  do 30% iduće sesije.
- Dnevni izazov `#/daily`: seeded (lib/daily.ts), isti za sve, 1×/dan.

Otvoreno iz ovog kruga: Codex radi UI polish (HomePage/TopicPage/
HeartsGate/QuestionBody + hearts badge u AppShell header s klik-refill) i
sadržaj (backend/general → 100+, novi tipovi u svim temama). Pravi ad
network umjesto stub reklame = kasnije.

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

## 2. Baza pitanja — 1029 pitanja kroz 11 tema (2026-08-23)

Ujutro je bilo 355 pitanja u 4 teme. Sada:
**SQL, Frontend, Backend, Opće, DevOps, Mreže, Sigurnost, Čudni kutovi,
Jezici, Arhitektura, Praksa** = 1029 pitanja, 91 cjelina.

Sedam novih tema pokriva ono što je pretraga banke pokazala kao rupe: cloud,
HTTP/2 i /3, WebSocket, OWASP, regex, Unicode, endianness, Agile/Scrum, licence
— ničega od toga prije nije bilo.

### Riješeno u ovom krugu

- **Duljina odgovora više ne odaje rješenje.** Bilo je 313 od 368 pitanja kod
  kojih je točan odgovor bio najduži i u prosjeku 2x dulji od netočnih, pa se
  85% moglo pogoditi bez znanja. Sada je prosječni omjer 1,07x, a provjera je
  GREŠKA u `validate:questions` (prag 1,3x) pa se ne može vratiti.
- **Sve 91 cjeline imaju ≥10 pitanja i uvodno pitanje** (`isIntro`).
- **24 koncepta povezana `conceptId`-em**, 22 kroz više tema, 20 kroz više
  vrsta pitanja — ista činjenica vraća se kao drugi oblik pitanja.
- **Posebne vrste pitanja: 243 od 1029** (bilo 20 od 355).

### Otvoreno

- Codexu su potrošeni krediti; njegovi zadaci (ZADATAK A/F/H/I/J) su dovršeni
  ručno. `AGENT_NOTES.txt` je time povijesni dokument, ne aktivan popis.
- Nove teme nemaju `code` blokove gotovo nigdje — prostor za dopunu.

## 3. Razmaknuto ponavljanje — u LEKCIJAMA (2026-08-23)

Leitner kutije po `conceptId` (`src/lib/scheduling.ts`), razmaci
**1/2/3/5/8/13 LEKCIJA** (ne dana — korisnikov feedback 2026-08-23: dani su
kriva jedinica jer tko odigra pet lekcija zaredom ne vidi ni jedno
ponavljanje). Brojač je `lessonCounter` u stanju.

- Promašeno → box 0 → vraća se u **sljedećoj** lekciji.
- Pogođeno svaki put → viđeno u lekcijama 1, 3, 6, 11, 19.
- Lekcija rezervira do 40% mjesta za dospjele koncepte.

State je V4; migracija V3→V4 čuva svaki stečeni box i rekonstruira brojač iz
stvarne povijesti. Pitanja mogu dijeliti `conceptId` kao varijante iste
činjenice (zasad samo 2 grupe — sadržaj je delegiran Codexu, ZADATAK H).

## 3b. Uvodna pitanja — NAPRAVLJENO (2026-08-23)

`isIntro: true` (mora biti `easy`). Prva lekcija u cjelini garantirano počinje
uvodnim pitanjima, i kasnije ona idu prva u nizu. Svih 33 cjelina ima po jedno;
cilj je 2-3 (Codex, ZADATAK J).

## 4. Spremnost za prave korisnike — NAPRAVLJENO (2026-08-22)

Oporavak lozinke (`#/auth/recovery`), ponovno slanje potvrde, brisanje računa,
hrvatske poruke o greškama, ErrorBoundary, validacija imena na serveru
(migracija 0004), sinkronizacija popisa grešaka (migracija 0003), čišćenje
napretka pri odjavi (spriječeno miješanje računa na dijeljenom uređaju).

**Migracije koje treba pokrenuti u Supabase SQL Editoru:**
`0003_lesson_struggled_ids.sql` i `0004_profile_hardening.sql`.
**Također:** dodati `<produkcijski-url>/#/auth/recovery` i
`http://localhost:5173/#/auth/recovery` u Supabase → Authentication →
URL Configuration → Redirect URLs, inače oporavak lozinke neće raditi.

## 5. Otvoreno / namjerno odgođeno

PWA + push podsjetnici (traži service worker, tablicu pretplata, Edge
Function i raspored — plus Supabase CLI setup); PvP (backend stoji, klijenta
nema, migracija 0002 blokirana); postavke/reset napretka; i18n; dark mode;
zvukovi; komponentni i hook testovi; a11y dorada (timer bez najave).

## 6. Linkovi

- Repo: https://github.com/VilimTrakos/techdingo
- Live app: https://vilimtrakos.github.io/techdingo/
