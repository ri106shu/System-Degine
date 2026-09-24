import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createNoteSchema = z.object({
  targetType: z.enum(['topic', 'question']),
  targetId: objectId,
  title: z.string().max(200).optional(),
  content: z.string().max(20000).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(20000).optional(),
});
