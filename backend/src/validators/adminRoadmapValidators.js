import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createRoadmapSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const updateRoadmapSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

export const createWeekSchema = z.object({
  weekNumber: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  order: z.coerce.number().int().optional(),
});

export const updateWeekSchema = z.object({
  weekNumber: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  order: z.coerce.number().int().optional(),
});

export const moveSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export const createDaySchema = z.object({
  dayNumber: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).max(200),
  focus: z.string().max(1000).optional(),
  time: z.string().max(100).optional(),
  dayType: z.enum(['study', 'rest']).optional(),
  notes: z.string().max(5000).optional(),
  order: z.coerce.number().int().optional(),
  topicIds: z.array(objectId).optional(),
  questionIds: z.array(objectId).optional(),
});

export const updateDaySchema = z.object({
  dayNumber: z.coerce.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  focus: z.string().max(1000).optional(),
  time: z.string().max(100).optional(),
  dayType: z.enum(['study', 'rest']).optional(),
  notes: z.string().max(5000).optional(),
  order: z.coerce.number().int().optional(),
  topicIds: z.array(objectId).optional(),
  questionIds: z.array(objectId).optional(),
});
