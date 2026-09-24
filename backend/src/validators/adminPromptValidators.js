import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createAdminPromptSchema = z.object({
  prompt: z.string().min(1).max(2000),
  followUps: z.array(z.string()).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  category: z.string().min(1).max(100),
  topicId: objectId,
  module: z.enum(['lld', 'hld']),
});

export const updateAdminPromptSchema = z.object({
  prompt: z.string().min(1).max(2000).optional(),
  followUps: z.array(z.string()).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  category: z.string().min(1).max(100).optional(),
  topicId: objectId.optional(),
  module: z.enum(['lld', 'hld']).optional(),
});
