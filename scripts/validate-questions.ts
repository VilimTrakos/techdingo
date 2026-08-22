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

function main(): void {
  const files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
  const reports: FileReport[] = [];
  const idToFiles = new Map<string, string[]>();

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
    for (const q of parsed.data) {
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

    // Svaka registrirana cjelina mora imati barem jedno pitanje - prazna
    // cjelina bi na putu učenja bila mrtav, neprelaziv čvor.
    for (const unit of getUnitsForTopic(expectedTopic)) {
      if (!unitCounts.has(unit.id)) {
        errors.push(`Cjelina "${unit.id}" iz src/data/units.ts nema nijedno pitanje u "${file}".`);
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

  if (reports.length === 0) {
    const totalQuestions = [...idToFiles.keys()].length;
    console.log(`✓ Sve datoteke pitanja su valjane (${files.length} tema, ${totalQuestions} pitanja ukupno).`);
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
