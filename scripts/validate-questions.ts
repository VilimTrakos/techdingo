import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { QuestionArraySchema } from '../src/data/schema';
import { getUnit, getUnitsForTopic } from '../src/data/units';
import { MIN_SESSION_SIZE } from '../src/lib/pool';

const QUESTIONS_DIR = join(import.meta.dirname, '..', 'src', 'data', 'questions');

interface FileReport {
  file: string;
  errors: string[];
}

/**
 * Koliko pitanja cjelina treba da lekcija od 8-10 pitanja prođe bez doslovnog
 * ponavljanja istog pitanja u istom sjedenju. Zasad UPOZORENJE, ne greška -
 * banka se još puni; postaje greška kad sve cjeline dosegnu prag.
 */
const MIN_QUESTIONS_PER_UNIT = 10;

/**
 * Koliko puta točan odgovor smije biti dulji od prosjeka netočnih prije nego
 * ga duljina počne odavati. Pitanje kod kojeg je točan odgovor najduži I
 * osjetno dulji od ostalih igrač može pogoditi bez ikakvog znanja - a onda
 * razmaknuto ponavljanje bilježi pogotke kao naučeno gradivo.
 *
 * Ovo je GREŠKA, ne upozorenje: banka je jednom već bila u stanju u kojem se
 * 85% pitanja moglo pogoditi biranjem najduljeg retka, i čišćenje toga bio je
 * posao od nekoliko stotina pitanja. Prag postoji da se to ne ponovi.
 */
const MAX_CORRECT_LENGTH_RATIO = 1.3;

/**
 * Ispod ove duljine razlika u duljini ne odaje ništa: nitko ne bira "O(n log n)"
 * umjesto "O(n)" zato što je dulje. Prag postoji da mjera ne prijavljuje
 * pitanja s kratkim, tehničkim odgovorima.
 */
const MIN_TELL_LENGTH = 30;

/** Odaje li duljina točan odgovor? Vraća omjer, ili null ako je pitanje u redu. */
function lengthTellRatio(options: string[], correctIndex: number): number | null {
  const correct = options[correctIndex]?.length ?? 0;
  if (correct < MIN_TELL_LENGTH) return null;
  const others = options.filter((_, i) => i !== correctIndex).map((o) => o.length);
  if (others.length === 0) return null;
  const mean = others.reduce((a, b) => a + b, 0) / others.length;
  if (mean === 0) return null;
  const ratio = correct / mean;
  const isLongest = others.every((len) => correct >= len);
  return isLongest && ratio > MAX_CORRECT_LENGTH_RATIO ? ratio : null;
}

/**
 * Pitanje koje se poziva na prikazani isječak, a nema `code`, doslovno je
 * neodgovorivo - igrač čita "iz ovog odgovora" i nema što gledati.
 *
 * Nastalo iz stvarne greške: tri `multi` pitanja bila su napisana uz isječak,
 * ali je pomoćnik kojim su generirana ispuštao polje `code`, pa su objavljena
 * bez njega. Nijedna druga provjera to nije uhvatila.
 */
const REFERENCIRA_ISJECAK =
  /\bov(aj|og|om|akav|akvo|akva|e|ih) (kod|ispis|odgovor|zahtjev|upit|zaglavlj|definicij|postavk|isječ|skript|naredb)|u ovom kodu|prikazan\w* (kod|isječ)/i;

/**
 * `npm run validate:questions -- --list-length-tells` ispisuje SVAKO pitanje
 * kod kojeg duljina odaje odgovor, najgore prvo - radna lista za prepravak
 * netočnih opcija.
 */
const LIST_LENGTH_TELLS = process.argv.includes('--list-length-tells');

function main(): void {
  const files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
  const reports: FileReport[] = [];
  const warnings: string[] = [];
  const idToFiles = new Map<string, string[]>();
  let introTotal = 0;
  let richKindTotal = 0;
  // Koncepti se broje GLOBALNO: varijante iste činjenice namjerno smiju živjeti
  // u različitim temama (npr. deadlock u backendu, jezicima i SQL-u).
  const conceptQuestions = new Map<string, { kinds: Set<string>; count: number }>();

  for (const file of files) {
    const expectedTopic = basename(file, '.json');
    const errors: string[] = [];
    const fullPath = join(QUESTIONS_DIR, file);

    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(fullPath, 'utf-8'));
    } catch (err) {
      reports.push({ file, errors: [`Nevažeći JSON: ${(err as Error).message}`] });
      continue;
    }

    const parsed = QuestionArraySchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`[${issue.path.join('.')}] ${issue.message}`);
      }
      reports.push({ file, errors });
      continue;
    }

    if (parsed.data.length < MIN_SESSION_SIZE) {
      errors.push(
        `Tema ima samo ${parsed.data.length} pitanja, a treba minimalno ${MIN_SESSION_SIZE} (da sesija od ${MIN_SESSION_SIZE}-17 pitanja može raditi bez ponavljanja).`,
      );
    }

    const unitCounts = new Map<string, number>();
    const unitIntroCounts = new Map<string, number>();
    const lengthTells: { id: string; ratio: number }[] = [];
    let singleCount = 0;
    for (const q of parsed.data) {
      if ((q.kind ?? 'single') === 'single') {
        singleCount++;
        const ratio = lengthTellRatio(q.options, q.correctIndex);
        if (ratio !== null) lengthTells.push({ id: q.id, ratio });
      }
      if (q.isIntro) {
        introTotal++;
        unitIntroCounts.set(q.unitId, (unitIntroCounts.get(q.unitId) ?? 0) + 1);
        // Uvod predstavlja NOVI pojam - ako je težak, ne uvodi nego odbija.
        if (q.difficulty !== 'easy') {
          errors.push(`Uvodno pitanje "${q.id}" ima difficulty "${q.difficulty}"; uvod mora biti "easy".`);
        }
      }
      if (q.kind && q.kind !== 'single') richKindTotal++;
      if (!q.code && REFERENCIRA_ISJECAK.test(q.question)) {
        errors.push(
          `Pitanje "${q.id}" se poziva na prikazani isječak ("${q.question.slice(0, 60)}…"), ` +
            `ali nema polje "code" - igraču nema što gledati.`,
        );
      }
      if (q.conceptId) {
        const entry = conceptQuestions.get(q.conceptId) ?? { kinds: new Set<string>(), count: 0 };
        entry.kinds.add(q.kind ?? 'single');
        entry.count++;
        conceptQuestions.set(q.conceptId, entry);
      }
      if (q.topic !== expectedTopic) {
        errors.push(`Pitanje "${q.id}" ima topic "${q.topic}", a nalazi se u datoteci "${file}" (očekivano "${expectedTopic}").`);
      }
      if (!getUnit(expectedTopic, q.unitId)) {
        errors.push(`Pitanje "${q.id}" ima unitId "${q.unitId}" koji ne postoji u src/data/units.ts za temu "${expectedTopic}".`);
      } else {
        unitCounts.set(q.unitId, (unitCounts.get(q.unitId) ?? 0) + 1);
      }
      const existing = idToFiles.get(q.id) ?? [];
      existing.push(file);
      idToFiles.set(q.id, existing);
    }

    if (lengthTells.length > 0 && LIST_LENGTH_TELLS) {
      console.log(`\n${file} - ${lengthTells.length} pitanja koja odaje duljina (najgore prvo):`);
      for (const tell of [...lengthTells].sort((a, b) => b.ratio - a.ratio)) {
        console.log(`  ${tell.ratio.toFixed(2)}x  ${tell.id}`);
      }
    }

    for (const tell of [...lengthTells].sort((a, b) => b.ratio - a.ratio)) {
      errors.push(
        `Pitanje "${tell.id}": točan odgovor je najduži i ${tell.ratio.toFixed(2)}x dulji od prosjeka netočnih, ` +
          `pa se pitanje može pogoditi bez znanja. Produlji netočne opcije ili skrati točnu (najviše ${MAX_CORRECT_LENGTH_RATIO}x).`,
      );
    }

    // Svaka registrirana cjelina mora imati barem jedno pitanje - prazna
    // cjelina bi na putu učenja bila mrtav, neprelaziv čvor.
    for (const unit of getUnitsForTopic(expectedTopic)) {
      const count = unitCounts.get(unit.id) ?? 0;
      if (count === 0) {
        errors.push(`Cjelina "${unit.id}" iz src/data/units.ts nema nijedno pitanje u "${file}".`);
        continue;
      }
      if (count < MIN_QUESTIONS_PER_UNIT) {
        warnings.push(
          `${file}: cjelina "${unit.id}" ima ${count} pitanja, a lekcija traži 8-10 - igrač će vidjeti isto pitanje više puta u istom sjedenju (cilj: ${MIN_QUESTIONS_PER_UNIT}).`,
        );
      }
      if (!unitIntroCounts.has(unit.id)) {
        warnings.push(
          `${file}: cjelina "${unit.id}" nema nijedno uvodno pitanje (isIntro) - prva lekcija počinje bez predstavljanja pojmova.`,
        );
      }
    }

    if (errors.length > 0) {
      reports.push({ file, errors });
    }
  }

  const duplicateIdErrors: string[] = [];
  for (const [id, filesWithId] of idToFiles) {
    if (filesWithId.length > 1) {
      duplicateIdErrors.push(`Id "${id}" se pojavljuje u više datoteka: ${filesWithId.join(', ')}`);
    }
  }
  if (duplicateIdErrors.length > 0) {
    reports.push({ file: '(globalno)', errors: duplicateIdErrors });
  }

  if (warnings.length > 0) {
    console.warn(`⚠ ${warnings.length} upozorenja o pokrivenosti sadržaja:\n`);
    for (const warning of warnings) {
      console.warn(`    - ${warning}`);
    }
    console.warn('');
  }

  const multiVariant = [...conceptQuestions.values()].filter((c) => c.count > 1).length;
  const multiKind = [...conceptQuestions.values()].filter((c) => c.kinds.size > 1).length;

  if (reports.length === 0) {
    const totalQuestions = [...idToFiles.keys()].length;
    console.log(
      `✓ Sve datoteke pitanja su valjane (${files.length} tema, ${totalQuestions} pitanja ukupno).\n` +
        `  uvodnih: ${introTotal} | posebnih vrsta (multi/fill/order): ${richKindTotal} | ` +
        `koncepata s više varijanti: ${multiVariant} (od toga ${multiKind} kroz više vrsta pitanja)`,
    );
    return;
  }

  console.error('✗ Validacija pitanja nije uspjela:\n');
  for (const report of reports) {
    console.error(`  ${report.file}:`);
    for (const error of report.errors) {
      console.error(`    - ${error}`);
    }
  }
  process.exit(1);
}

main();
