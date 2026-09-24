import { z } from 'zod';

export const createQuestionSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().trim().max(1000).optional().default(''),
  module: z.enum(['lld', 'hld']),
  topicId: z.string().trim().min(1, 'Topic is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  type: z.enum(['Design Pattern', 'LLD Problem', 'Case Study']).optional(),
  expectedTime: z.coerce.number().int().min(5, 'At least 5 minutes').max(240),
  hints: z.array(z.string().trim().min(1)).max(10).optional().default([]),
  solutionNotes: z.string().trim().max(2000).optional().default(''),
  tags: z.array(z.string().trim().min(1)).max(10).optional().default([]),
});

export const updateQuestionSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  type: z.enum(['Design Pattern', 'LLD Problem', 'Case Study']).optional(),
  expectedTime: z.coerce.number().int().min(5).max(240).optional(),
  hints: z.array(z.string().trim().min(1)).max(10).optional(),
  solutionNotes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1)).max(10).optional(),
});
