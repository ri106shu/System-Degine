import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const addTopicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(2, 'Category is required').max(60),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  module: z.enum(['lld', 'hld']),
});

export const addQuestionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(1000).optional(),
  module: z.enum(['lld', 'hld']),
  topicId: z.string().min(1, 'Pick a topic'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  expectedTime: z.coerce.number().int().min(5, 'At least 5 minutes').max(240),
  hints: z.string().optional(), // one per line in the form, split before submit
  solutionNotes: z.string().max(2000).optional(),
  tags: z.string().optional(), // comma-separated in the form, split before submit
});
