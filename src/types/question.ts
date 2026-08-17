// Nema runtime ovisnosti - sigurno za import bilo gdje (app kod, testovi, build skripte).

export type TopicId = string;

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  /** Globalno jedinstven identifikator, npr. "sql-001-inner-vs-left-join". */
  id: string;
  /** Mora odgovarati temi (imenu datoteke) u kojoj se pitanje nalazi. */
  topic: TopicId;
  question: string;
  /** Točno 4 ponuđena odgovora. */
  options: [string, string, string, string];
  /** Indeks točnog odgovora u `options`. */
  correctIndex: 0 | 1 | 2 | 3;
  /** Kratko objašnjenje prikazano nakon odgovora (preporučeno, nije obavezno). */
  explanation?: string;
  /** Koristi se za progresiju unutar sesije (easy -> medium -> hard). */
  difficulty: Difficulty;
}
