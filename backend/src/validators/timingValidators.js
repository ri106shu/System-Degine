import { z } from 'zod';

export const updateTimingSchema = z.object({
  module: z.enum(['lld', 'hld']),
  type: z.enum(['topic', 'question']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  durationMinutes: z.coerce.number().positive(),
});
