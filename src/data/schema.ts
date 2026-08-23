// SAMO za scripts/validate-questions.ts i testove - nikad ne importiraj ovo
// iz app koda (src/main.tsx stabla) da zod ne završi u produkcijskom bundleu.
import { z } from 'zod';

const BaseFields = {
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'id smije sadržavati samo mala slova, brojke i crtice'),
  topic: z.string().min(1),
  unitId: z.string().min(1),
  conceptId: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'conceptId smije sadržavati samo mala slova, brojke i crtice')
    .optional(),
  question: z.string().min(1),
  code: z.string().min(1).optional(),
  explanation: z.string().min(1).optional(),
  isIntro: z.boolean().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
};

function hasDuplicateOptions(options: string[]): boolean {
  const normalized = options.map((o) => o.trim().toLowerCase());
  return new Set(normalized).size !== normalized.length;
}

const SingleChoiceSchema = z
  .object({
    ...BaseFields,
    kind: z.literal('single').optional(),
    options: z
      .array(z.string().min(1))
      .length(4, 'mora postojati točno 4 ponuđena odgovora'),
    correctIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  })
  .superRefine((q, ctx) => {
    if (hasDuplicateOptions(q.options)) {
      ctx.addIssue({ code: 'custom', message: 'opcije sadrže duplikat (case-insensitive)' });
    }
  });

const MultiChoiceSchema = z
  .object({
    ...BaseFields,
    kind: z.literal('multi'),
    options: z.array(z.string().min(1)).min(4).max(6),
    correctIndexes: z.array(z.number().int().min(0)).min(2),
  })
  .superRefine((q, ctx) => {
    if (hasDuplicateOptions(q.options)) {
      ctx.addIssue({ code: 'custom', message: 'opcije sadrže duplikat (case-insensitive)' });
    }
    const unique = new Set(q.correctIndexes);
    if (unique.size !== q.correctIndexes.length) {
      ctx.addIssue({ code: 'custom', message: 'correctIndexes sadrži duplikat' });
    }
    if (q.correctIndexes.some((i) => i >= q.options.length)) {
      ctx.addIssue({ code: 'custom', message: 'correctIndexes pokazuje izvan options polja' });
    }
    if (unique.size >= q.options.length) {
      ctx.addIssue({ code: 'custom', message: 'barem jedna opcija mora biti netočna' });
    }
  });

const FillBlankSchema = z
  .object({
    ...BaseFields,
    kind: z.literal('fill'),
    text: z.string().min(1),
    answers: z.array(z.string().min(1)).min(1),
    distractors: z.array(z.string().min(1)).min(1),
  })
  .superRefine((q, ctx) => {
    const blanks = (q.text.match(/___/g) ?? []).length;
    if (blanks !== q.answers.length) {
      ctx.addIssue({
        code: 'custom',
        message: `broj praznina "___" u text (${blanks}) mora odgovarati broju answers (${q.answers.length})`,
      });
    }
    const bank = [...q.answers, ...q.distractors].map((w) => w.trim().toLowerCase());
    if (new Set(bank).size !== bank.length) {
      ctx.addIssue({ code: 'custom', message: 'answers + distractors sadrže duplikat (case-insensitive)' });
    }
  });

const OrderStepsSchema = z
  .object({
    ...BaseFields,
    kind: z.literal('order'),
    steps: z.array(z.string().min(1)).min(3).max(6),
  })
  .superRefine((q, ctx) => {
    if (hasDuplicateOptions(q.steps)) {
      ctx.addIssue({ code: 'custom', message: 'koraci sadrže duplikat (case-insensitive)' });
    }
  });

export const QuestionSchema = z.union([
  SingleChoiceSchema,
  MultiChoiceSchema,
  FillBlankSchema,
  OrderStepsSchema,
]);

export const QuestionArraySchema = z.array(QuestionSchema);

export type ValidatedQuestion = z.infer<typeof QuestionSchema>;
