// Nema runtime ovisnosti - sigurno za import bilo gdje (app kod, testovi, build skripte).

export type TopicId = string;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionKind = 'single' | 'multi' | 'fill' | 'order';

interface QuestionBase {
  /** Globalno jedinstven identifikator, npr. "sql-001-inner-vs-left-join". */
  id: string;
  /** Mora odgovarati temi (imenu datoteke) u kojoj se pitanje nalazi. */
  topic: TopicId;
  /** Lekcijska cjelina (podtema) unutar teme - mora postojati u src/data/units.ts. */
  unitId: string;
  /**
   * Pitanja koja dijele `conceptId` su VARIJANTE iste činjenice (npr. isti
   * pojam kao "odaberi točno" i kao "popuni prazninu"). Napredak se vodi po
   * konceptu, pa točan odgovor na jednu varijantu vrijedi za sve.
   * Izostavljeno = pitanje je samo sebi koncept.
   */
  conceptId?: string;
  question: string;
  /**
   * Opcionalan isječak koda/upita prikazan u monospace bloku iznad pitanja
   * ("Što ovaj upit vraća?", "Gdje je bug?"). Dostupno SVIM vrstama pitanja.
   */
  code?: string;
  /** Kratko objašnjenje prikazano nakon odgovora (preporučeno, nije obavezno). */
  explanation?: string;
  /**
   * Uvodno pitanje cjeline: predstavlja NOVI POJAM prije nego se on počne
   * ozbiljno ispitivati (Duolingo prvo pokaže riječ, pa je tek onda traži).
   * Prva lekcija u cjelini garantirano počinje s takvim pitanjima, a i
   * kasnije ona uvijek idu prva u nizu. Treba biti `difficulty: "easy"`.
   */
  isIntro?: boolean;
  /** Koristi se za progresiju unutar sesije (easy -> medium -> hard). */
  difficulty: Difficulty;
}

/** Klasično pitanje s jednim točnim odgovorom. `kind` izostavljen = 'single' (323 postojeća pitanja). */
export interface SingleChoiceQuestion extends QuestionBase {
  kind?: 'single';
  /** Točno 4 ponuđena odgovora. */
  options: [string, string, string, string];
  /** Indeks točnog odgovora u `options`. */
  correctIndex: 0 | 1 | 2 | 3;
}

/** "Odaberi sve točne" - više točnih odgovora, potvrda gumbom. */
export interface MultiChoiceQuestion extends QuestionBase {
  kind: 'multi';
  /** 4-6 ponuđenih odgovora. */
  options: string[];
  /** Indeksi SVIH točnih odgovora (barem 2, ne svi). */
  correctIndexes: number[];
}

/** "Popuni prazninu" - tekst s prazninama `___`, banka riječi za tapkanje. */
export interface FillBlankQuestion extends QuestionBase {
  kind: 'fill';
  /** Tekst s prazninama označenim s točno `___` (tri underscora) po praznini. */
  text: string;
  /** Točne riječi, redom praznina. Broj mora odgovarati broju `___` u `text`. */
  answers: string[];
  /** Dodatne (krive) riječi u banci - barem 1. */
  distractors: string[];
}

/** "Poredaj korake" - koraci se prikazuju izmiješani, slažu se u točan redoslijed. */
export interface OrderStepsQuestion extends QuestionBase {
  kind: 'order';
  /** Koraci u TOČNOM redoslijedu (3-6). Prikazuju se izmiješano. */
  steps: string[];
}

export type Question =
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | FillBlankQuestion
  | OrderStepsQuestion;

/** Normalizira opcionalni discriminant ('single' kad je kind izostavljen). */
export function questionKind(q: Question): QuestionKind {
  return q.kind ?? 'single';
}

/** Koncept kojem pitanje pripada; bez `conceptId` pitanje je samo sebi koncept. */
export function conceptOf(q: Question): string {
  return q.conceptId ?? q.id;
}
