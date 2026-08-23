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

function main(): void {
  const files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
  const reports: FileReport[] = [];
  const warnings: string[] = [];
  const idToFiles = new Map<string, string[]>();
  let introTotal = 0;
  let variantTotal = 0;
  let richKindTotal = 0;

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
    const conceptCounts = new Map<string, number>();
    for (const q of parsed.data) {
      if (q.isIntro) {
        introTotal++;
        unitIntroCounts.set(q.unitId, (unitIntroCounts.get(q.unitId) ?? 0) + 1);
        // Uvod predstavlja NOVI pojam - ako je težak, ne uvodi nego odbija.
        if (q.difficulty !== 'easy') {
          errors.push(`Uvodno pitanje "${q.id}" ima difficulty "${q.difficulty}"; uvod mora biti "easy".`);
        }
      }
      if (q.kind && q.kind !== 'single') richKindTotal++;
      if (q.conceptId) conceptCounts.set(q.conceptId, (conceptCounts.get(q.conceptId) ?? 0) + 1);
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

    variantTotal += [...conceptCounts.values()].filter((n) => n > 1).length;

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

  if (reports.length === 0) {
    const totalQuestions = [...idToFiles.keys()].length;
    console.log(
      `✓ Sve datoteke pitanja su valjane (${files.length} tema, ${totalQuestions} pitanja ukupno).\n` +
        `  uvodnih: ${introTotal} | posebnih vrsta (multi/fill/order): ${richKindTotal} | koncepata s više varijanti: ${variantTotal}`,
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
