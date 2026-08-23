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

## Dva pravila koja provjerava CI

Prije nego napišeš pitanje, ova dva pravila štede najviše vremena:

**1. Duljina odgovora ne smije odavati rješenje.** Točan odgovor ne smije biti
najduži I osjetno dulji (preko 1,3x prosjeka) od netočnih. Ovo je greška, ne
savjet: banka je jednom bila u stanju u kojem se 85% pitanja moglo pogoditi
biranjem najduljeg retka, bez ikakvog znanja.

```jsonc
// LOŠE - točan odgovor se vidi izdaleka
"options": [
  "INNER vraća samo podudarajuće retke, LEFT sve iz lijeve tablice plus podudarajuće iz desne, RIGHT obrnuto",
  "Nema razlike, to su sinonimi"
]

// DOBRO - sve opcije nose jednaku težinu
"options": [
  "INNER vraća podudarne, LEFT sve iz lijeve, RIGHT iz desne, FULL iz obje",
  "LEFT vraća podudarne, INNER sve iz lijeve, RIGHT iz desne, FULL iz obje"
]
```

Najbolji izvor netočnih opcija su **stvarne zablude**: zamijenjeni pojmovi,
"skoro točno ali ne baš", i pravilo koje vrijedi u drugom kontekstu. Izbjegavaj
opcije tipa *"Nema razlike"* - njih nitko ne bira, pa pitanje efektivno ima tri
odgovora.

**2. Svaka cjelina treba barem 10 pitanja** i barem jedno uvodno. Lekcija traži
8-10 pitanja, pa tanja cjelina znači da igrač isto pitanje vidi dvaput u istom
sjedenju.

Oboje provjerava `npm run validate:questions`. Popis pitanja koja odaje duljina
dobiješ s `npm run validate:questions -- --list-length-tells`.

## Uvodna pitanja (`isIntro`)

Prvo pitanje cjeline treba **predstaviti pojam prije nego ga se ispituje** -
kao što Duolingo prvo pokaže riječ, pa je tek onda traži. Takva pitanja nose
`"isIntro": true` i moraju biti `easy`.

```jsonc
{
  "id": "sql-uvod-transakcije",
  "unitId": "transakcije",
  "isIntro": true,
  "difficulty": "easy",
  "question": "Što je transakcija u bazi podataka?",
  "options": ["Skup naredbi koji se izvršava kao jedna cjelina", "..."]
}
```

Prva lekcija u cjelini garantirano počinje njima, a i kasnije idu prva u nizu.

## Kako dodati novo pitanje

Pitanja žive u `src/data/questions/<tema>.json`. Teme su `sql`, `frontend`,
`backend`, `general`, `devops`, `mreze`, `sigurnost`, `cudni-kutovi`, `jezici`,
`arhitektura` i `praksa`. Svaka datoteka je JSON niz objekata.

### Zajednička polja (sve vrste pitanja)

| Polje | Obavezno | Opis |
|---|---|---|
| `id` | da | Globalno jedinstven, format `<tema>-<broj>-<slug>` (mala slova, brojke, crtice) |
| `topic` | da | Mora odgovarati imenu datoteke |
| `unitId` | da | Cjelina unutar teme - vrijednosti su u `src/data/units.ts` |
| `difficulty` | da | `easy`, `medium` ili `hard` |
| `question` | da | Tekst pitanja |
| `explanation` | preporučeno | Kratko objašnjenje, prikazuje se nakon odgovora |
| `code` | ne | Isječak koda prikazan iznad pitanja (koristi `\n` za nove retke) |
| `conceptId` | ne | Povezuje varijante iste činjenice - vidi dolje |
| `isIntro` | ne | Uvodno pitanje cjeline; mora biti `difficulty: "easy"` - vidi dolje |
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

**Koncepti smiju prelaziti granicu teme.** Deadlock se pita u Backendu, Jezicima
i SQL-u; to je ista činjenica iz tri kuta, pa nosi isti `conceptId` i napredak
putuje s njom. Takvi slugovi zato ne nose ime jedne teme (`deadlock`, ne
`sql-deadlock`).

Format: kratak slug bez broja, mala slova i crtice. Izostavljeno = pitanje je
samo sebi koncept.

Najveća vrijednost je kad varijante koriste **različite vrste** pitanja: ako si
pojam promašio kao izbor odgovora, dvije lekcije kasnije vraća se kao popuna
praznine, pa se provjerava dosjećanje, a ne pamćenje jednog teksta.

### Pravila

- Pitanje i svi odgovori su na **hrvatskom jeziku**.
- Piši vlastiti tekst - izbjegavaj doslovno kopiranje iz udžbenika ili tuđe
  dokumentacije.
- Krivi odgovori trebaju biti uvjerljivi, ne očito besmisleni, i **usporedive
  duljine kao točan** (vidi "Dva pravila koja provjerava CI" na vrhu).
- Cilj je ≥10 pitanja po cjelini; cjeline s premalo pitanja daju lekcije u
  kojima se isto pitanje ponavlja više puta u istom sjedenju.
- Svaka cjelina treba barem jedno uvodno pitanje (`isIntro`).

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
