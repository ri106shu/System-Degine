import { z } from 'zod';

// No `questionIds`/`topicIds` field exists here on purpose — structurally
// no way for a request body to influence which topics or questions end up
// in a mock. No `duration` field either, for the same reason: the total is
// always computed backend-side from each item's own resolved timing, never
// accepted as a number the client hands over. createMockSchema.strip()
// (Zod's default) discards any extra keys sent, before the service layer
// ever sees req.body.
export const createMockSchema = z.object({
  mode: z.enum(['lld', 'hld', 'mixed']),
  type: z.enum(['topic', 'question']).default('question'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).optional().default('Mixed'),
  questionCount: z.coerce.number().int().min(1).max(30).default(5),
  // 'auto' (default) resolves each item's duration from timing config/user
  // overrides. 'custom' applies one caller-chosen duration to every item —
  // still validated against nothing here, since the resolved seconds are
  // simply used as-is per item; there is no per-difficulty range check for
  // a custom total the way there is for a single timing-preference update,
  // because a custom mock is explicitly the user overriding the guidance.
  durationMode: z.enum(['auto', 'custom']).default('auto'),
  customDurationMinutes: z.coerce.number().int().min(1).max(180).optional(),
});

// No `score`/`feedback` field on any of these on purpose — those only ever
// come from a real evaluation mechanism (not built yet), never from a
// client-supplied number that would otherwise sail straight through to
// MockInterview.questions[].score and become a fabricated result.
export const submitAnswerSchema = z.object({
  questionIndex: z.coerce.number().int().min(0),
  answer: z.string().max(20000).default(''),
  timeSpentSeconds: z.coerce.number().min(0).default(0),
});

export const navigateSchema = z.object({
  questionIndex: z.coerce.number().int().min(0),
});

export const finishMockSchema = z.object({
  questionIndex: z.coerce.number().int().min(0).optional(),
  answer: z.string().max(20000).optional(),
  timeSpentSeconds: z.coerce.number().min(0).optional(),
});
