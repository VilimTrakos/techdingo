// Generira supabase/seed_questions_meta.sql iz src/data/questions/*.json.
// Puni SAMO id/topic/difficulty (nikad correctIndex/options - odgovori
// ostaju isključivo u client bundleu). Pokreni ponovno i zalijepi izlaznu
// datoteku u Supabase SQL Editor svaki put kad se baza pitanja promijeni
// (npr. nakon što se ubace nova Codexova pitanja) - vidi CONTRIBUTING.md.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Question } from '../src/types/question';

const QUESTIONS_DIR = join(import.meta.dirname, '..', 'src', 'data', 'questions');
const OUTPUT_PATH = join(import.meta.dirname, '..', 'supabase', 'seed_questions_meta.sql');

function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function main(): void {
  const files = readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
  const rows: string[] = [];

  for (const file of files) {
    const questions: Question[] = JSON.parse(readFileSync(join(QUESTIONS_DIR, file), 'utf-8'));
    for (const q of questions) {
      rows.push(`  (${sqlStringLiteral(q.id)}, ${sqlStringLiteral(q.topic)}, ${sqlStringLiteral(q.difficulty)})`);
    }
  }

  const sql = `-- AUTO-GENERIRANO iz src/data/questions/*.json - scripts/generate-question-metadata-seed.ts
-- Ne uređuj ručno. Pokreni "npx tsx scripts/generate-question-metadata-seed.ts"
-- da regeneriraš, pa zalijepi cijeli sadržaj u Supabase SQL Editor.
-- Pokreni NAKON supabase/migrations/0001_init.sql.

truncate table public.questions_meta;

insert into public.questions_meta (id, topic_id, difficulty) values
${rows.join(',\n')};
`;

  writeFileSync(OUTPUT_PATH, sql, 'utf-8');
  console.log(`Napisano ${rows.length} redaka u ${OUTPUT_PATH}`);
}

main();
