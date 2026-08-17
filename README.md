# TechDingo 🐕

Gamificirana web aplikacija za uvježbavanje tehničkih intervju pitanja —
SQL, Frontend i Backend. Duolingo-stil solo lekcije (srca, streak, XP) +
"Score Strike" brzinski mod (timer, bodovi, combo, osobni rekord).

Potpuno statična aplikacija — bez backenda, bez baze podataka, sav napredak
se sprema lokalno u tvom pregledniku (`localStorage`).

## Značajke

- **Lekcije po temama** (SQL / Frontend / Backend) — svaka sesija nasumično
  odabire 15-17 pitanja, 5 srca po pokušaju, dnevni streak i XP.
- **Score Strike** — brzinski izazov s timerom po pitanju, bodovanjem,
  combo multiplikatorom i osobnim rekordom (po temi ili "sve teme" mix).
- **65+ pitanja** o SQL-u, frontendu i backendu, s objašnjenjem nakon svakog
  odgovora.
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
