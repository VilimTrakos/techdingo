# Doprinošenje TechDingu

Hvala na interesu za doprinos! Najčešći i najpoželjniji oblik doprinosa su
**nova pitanja** za bazu, ali dobrodošli su i ispravci grešaka i nove
funkcionalnosti.

## Licenca doprinosa (pročitaj prije slanja PR-a)

TechDingo koristi dvostruko licenciranje - vidi [LICENSING.md](./LICENSING.md)
za pun kontekst.

> Slanjem pull requesta ili drugog doprinosa ovom repozitoriju, pristaješ
> da: (1) tvoj doprinos se licencira projektu pod AGPL-3.0 licencom; i
> (2) održavatelju projekta (kontakt: forscommh@gmail.com) daješ pravo da
> tvoj doprinos dodatno licencira pod zasebnim komercijalnim uvjetima
> trećim stranama, kao dio dual-licensing modela ovog projekta. Ovo je
> potrebno kako bi održavatelj mogao ponuditi komercijalnu licencu uz
> postojeću open-source AGPL-3.0 licencu. Ako se ne slažeš s ovim, molimo
> ne šalji doprinos, ili nam se javi na forscommh@gmail.com da razgovaramo
> o alternativnom dogovoru prije otvaranja PR-a.

## Kako dodati novo pitanje

Pitanja žive u `src/data/questions/<tema>.json` (`sql.json`, `frontend.json`,
`backend.json`, `general.json`). Svaka datoteka je JSON niz objekata.

### Zajednička polja (sve vrste pitanja)

| Polje | Obavezno | Opis |
|---|---|---|
| `id` | da | Globalno jedinstven, format `<tema>-<broj>-<slug>` (mala slova, brojke, crtice) |
| `topic` | da | Mora odgovarati datoteci (`sql`, `frontend`, `backend`, `general`) |
| `unitId` | da | Cjelina unutar teme - vrijednosti su u `src/data/units.ts` |
| `difficulty` | da | `easy`, `medium` ili `hard` |
| `question` | da | Tekst pitanja |
| `explanation` | preporučeno | Kratko objašnjenje, prikazuje se nakon odgovora |
| `code` | ne | Isječak koda prikazan iznad pitanja (koristi `\n` za nove retke) |
| `conceptId` | ne | Povezuje varijante iste činjenice - vidi dolje |
| `kind` | ne | Vrsta pitanja; izostavljeno = `single` |

### Vrste pitanja

**1. `single` (zadano) - jedan točan odgovor**

```json
{
  "id": "sql-023-primjer",
  "topic": "sql",
  "unitId": "osnove-upita",
  "difficulty": "easy",
  "question": "Što radi X u odnosu na Y?",
  "options": ["Točan odgovor", "Uvjerljiv ali pogrešan", "Još jedan pogrešan", "Očito pogrešan"],
  "correctIndex": 0,
  "explanation": "Zašto je prvi odgovor točan."
}
```
`options` mora imati **točno 4** međusobno različita odgovora; `correctIndex` je 0-3.

**2. `multi` - odaberi sve točne**

```json
{
  "kind": "multi",
  "options": ["Prvi točan", "Netočan", "Drugi točan", "Još jedan netočan"],
  "correctIndexes": [0, 2]
}
```
4-6 opcija, barem 2 točne, ali **ne smiju sve biti točne**.

**3. `fill` - popuni prazninu**

```json
{
  "kind": "fill",
  "text": "SELECT ime ___ korisnici ___ dob >= 18;",
  "answers": ["FROM", "WHERE"],
  "distractors": ["GROUP", "HAVING"]
}
```
Svaka praznina je točno `___` (tri podvlake). Broj praznina mora odgovarati
broju `answers`, redom. `distractors` su krive riječi u banci (barem 1).
Sve riječi (`answers` + `distractors`) moraju biti međusobno različite.

**4. `order` - poredaj korake**

```json
{
  "kind": "order",
  "steps": ["FROM / JOIN", "WHERE", "GROUP BY", "SELECT"]
}
```
3-6 koraka **u točnom redoslijedu** - aplikacija ih prikazuje izmiješane.

### `conceptId` - varijante iste činjenice

Ista činjenica smije postojati u više vrsta pitanja. Daj im isti `conceptId`
i aplikacija će znati da je riječ o istom gradivu: točan odgovor na jednu
varijantu vrijedi za sve, a kad koncept dođe na ponavljanje bira se varijanta
koju korisnik nije zadnji put vidio.

```json
{ "id": "sql-101-having-single", "conceptId": "sql-having-vs-where", "kind": "single", ... }
{ "id": "sql-102-having-fill",   "conceptId": "sql-having-vs-where", "kind": "fill",   ... }
```

Format: `<tema>-<slug>` bez broja. Izostavljeno = pitanje je samo sebi koncept.

### Pravila

- Pitanje i svi odgovori su na **hrvatskom jeziku**.
- Piši vlastiti tekst - izbjegavaj doslovno kopiranje iz udžbenika ili tuđe
  dokumentacije.
- Krivi odgovori trebaju biti uvjerljivi, ne očito besmisleni.
- Cilj je ≥10 pitanja po cjelini; cjeline s premalo pitanja daju lekcije u
  kojima se isto pitanje ponavlja više puta u istom sjedenju.

Prije slanja PR-a provjeri format:

```bash
npm run validate:questions
```

Skripta provjerava jedinstvenost id-jeva, ispravnost svake vrste pitanja,
da `unitId` postoji u `src/data/units.ts` i da nijedna cjelina nije prazna -
i pokreće se automatski u CI-u na svaki PR.

## Kako doprinijeti kodu

1. Forkaj repozitorij i napravi granu za svoju izmjenu.
2. Pokreni `npm install`, pa `npm run dev` za lokalni razvoj.
3. Prije PR-a provjeri: `npm run lint`, `npm run typecheck`, `npm run test`,
   `npm run validate:questions`, `npm run build`.
4. Otvori pull request s jasnim opisom promjene.
