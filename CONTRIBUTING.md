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
`backend.json` - nova tema = nova datoteka + jedan red u `src/data/topics.ts`).
Svaka datoteka je JSON niz objekata ovog oblika:

```json
{
  "id": "sql-023-primjer-pitanja",
  "topic": "sql",
  "question": "Što radi X u odnosu na Y?",
  "options": [
    "Točan i jasan odgovor",
    "Uvjerljiv ali pogrešan odgovor",
    "Još jedan pogrešan odgovor",
    "Očito pogrešan odgovor"
  ],
  "correctIndex": 0,
  "explanation": "Kratko objašnjenje zašto je prvi odgovor točan, prikazuje se korisniku nakon što odgovori."
}
```

Pravila:

- `id` mora biti globalno jedinstven (preko svih tema), format
  `<tema>-<broj>-<kratki-slug>` (samo mala slova, brojke, crtice).
- `topic` mora odgovarati datoteci u kojoj se pitanje nalazi.
- `options` mora imati **točno 4** neprazna, međusobno različita odgovora
  (bez obzira na velika/mala slova).
- `correctIndex` je 0-3 i pokazuje na točan odgovor u `options`.
- `explanation` je preporučen (nije obavezan) - kratko, jasno objašnjenje.
- Pitanje i svi odgovori su na **hrvatskom jeziku**.
- Piši vlastiti tekst - izbjegavaj doslovno kopiranje iz udžbenika ili tuđe
  dokumentacije.

Prije slanja PR-a, provjeri da je pitanje ispravno formatirano:

```bash
npm run validate:questions
```

Ova skripta provjerava da su svi id-jevi jedinstveni, da svako pitanje ima
točno 4 opcije bez duplikata, da `correctIndex` postoji i da svaka tema ima
dovoljno pitanja - i pokreće se automatski u CI-u na svaki PR.

## Kako doprinijeti kodu

1. Forkaj repozitorij i napravi granu za svoju izmjenu.
2. Pokreni `npm install`, pa `npm run dev` za lokalni razvoj.
3. Prije PR-a provjeri: `npm run lint`, `npm run typecheck`, `npm run test`,
   `npm run validate:questions`, `npm run build`.
4. Otvori pull request s jasnim opisom promjene.
