# TechDingo

Gamificirana web aplikacija za uvježbavanje tehničkih intervju pitanja —
SQL, Frontend, Backend i opći tehnički temelji. Duolingo-stil put učenja s
cjelinama, srcima, nizom i XP-om, plus "Score Strike" brzinski mod.

Aplikacija radi potpuno lokalno i sprema napredak u `localStorage`, a opcionalna
Supabase integracija omogućuje račun, sinkronizaciju između uređaja i ljestvicu.

## Značajke

- **Put učenja po temama** — jedanaest područja (SQL, Frontend, Backend, Opće,
  DevOps, Mreže, Sigurnost, Čudni kutovi, Jezici, Arhitektura, Praksa) dijeli
  se na cjeline poredane od osnova prema naprednom, koje se otključavaju redom.
- **Četiri vrste pitanja** — klasičan izbor, "odaberi sve točne", popunjavanje
  praznina iz banke riječi i slaganje koraka u točan redoslijed; uz opcionalni
  isječak koda.
- **Razmaknuto ponavljanje** — gradivo se vraća kroz više lekcija u sve većim
  razmacima dok se stvarno ne zapamti, a promašaj ga vraća na početak.
- **Ponovi greške** — zaseban mod koji vježba isključivo pitanja koja si
  promašio; ne troši srca.
- **Trajna srca** — zaliha od 5 koja se dijeli kroz sve lekcije i regenerira
  jedno svaka 4 sata.
- **Score Strike** — brzinski izazov s timerom, combo multiplikatorom i osobnim
  rekordom (po temi ili "sve teme" mix).
- **Dnevni izazov** — 10 pitanja iz svih tema, ista za sve igrače, jednom dnevno.
- **Ljestvica i značke** — javna ljestvica po temama (uz račun) i lokalna
  postignuća.
- **1000+ pitanja** kroz jedanaest područja, s objašnjenjem nakon svakog
  odgovora. Svaka cjelina počinje uvodnim pitanjima koja predstavljaju pojmove.
- **Razmaknuto ponavljanje mjereno u lekcijama** — promašen pojam vraća se već
  u sljedećoj lekciji, a naučen se javlja sve rjeđe (1/2/3/5/8/13 lekcija).
  Ista činjenica može se vratiti kao druga vrsta pitanja.
- Otvoren za doprinose — dodavanje novih pitanja je pull request na jednu
  JSON datoteku, validiran automatski u CI-u.

## Lokalni razvoj

```bash
npm install
npm run dev
```

Ostale korisne skripte:

```bash
npm run lint               # oxlint
npm run typecheck          # tsc --noEmit
npm run test                # vitest
npm run validate:questions  # provjera JSON baze pitanja
npm run build               # produkcijski build
```

## Doprinošenje

Dodavanje novih pitanja je najjednostavniji i najpoželjniji oblik doprinosa
— vidi [CONTRIBUTING.md](./CONTRIBUTING.md) za shemu pitanja i upute.

## Licenca

TechDingo je dvostruko licenciran: [AGPL-3.0](./LICENSE) za otvoreni izvor,
uz mogućnost zasebne komercijalne licence za zatvorene komercijalne
proizvode. Detalji u [LICENSING.md](./LICENSING.md).
