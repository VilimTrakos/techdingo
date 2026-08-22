// SAMO za scripts/validate-questions.ts i testove - nikad ne importiraj ovo
// iz app koda (src/main.tsx stabla) da zod ne završi u produkcijskom bundleu.
import { z } from 'zod';

export const QuestionSchema = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, 'id smije sadržavati samo mala slova, brojke i crtice'),
    topic: z.string().min(1),
    unitId: z.string().min(1),
    question: z.string().min(1),
    options: z
      .array(z.string().min(1))
      .length(4, 'mora postojati točno 4 ponuđena odgovora'),
    correctIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    explanation: z.string().min(1).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })
  .superRefine((q, ctx) => {
    const normalized = q.options.map((o) => o.trim().toLowerCase());
    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
      ctx.addIssue({ code: 'custom', message: 'opcije sadrže duplikat (case-insensitive)' });
    }
  });

export const QuestionArraySchema = z.array(QuestionSchema);

export type ValidatedQuestion = z.infer<typeof QuestionSchema>;
