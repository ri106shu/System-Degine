import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createAdminQuestionSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  type: z.enum(['Design Pattern', 'LLD Problem', 'Case Study']),
  expectedTime: z.coerce.number().int().positive(),
  topicId: objectId,
  module: z.enum(['lld', 'hld']),
  hints: z.array(z.string()).optional(),
  solutionNotes: z.string().max(10000).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateAdminQuestionSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  type: z.enum(['Design Pattern', 'LLD Problem', 'Case Study']).optional(),
  expectedTime: z.coerce.number().int().positive().optional(),
  topicId: objectId.optional(),
  module: z.enum(['lld', 'hld']).optional(),
  hints: z.array(z.string()).optional(),
  solutionNotes: z.string().max(10000).optional(),
  tags: z.array(z.string()).optional(),
});
