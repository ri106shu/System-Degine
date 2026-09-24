import { z } from 'zod';

export const createAdminTopicSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  module: z.enum(['lld', 'hld']),
  slug: z.string().max(200).optional(),
  order: z.coerce.number().int().optional(),
});

export const updateAdminTopicSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  module: z.enum(['lld', 'hld']).optional(),
  slug: z.string().max(200).optional(),
  order: z.coerce.number().int().optional(),
});
