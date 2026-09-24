import { z } from 'zod';

export const createTopicSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().default(''),
  category: z.string().trim().min(2, 'Category is required').max(60),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  module: z.enum(['lld', 'hld']),
});

export const updateTopicSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});
