import { z } from 'zod';

export const updateProgressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']),
  confidence: z.coerce.number().int().min(1).max(5).optional(),
  timeSpent: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
});
