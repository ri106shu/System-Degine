import { z } from 'zod';

export const updatePlatformSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const updateModuleSettingsSchema = z.object({
  lldEnabled: z.boolean().optional(),
  hldEnabled: z.boolean().optional(),
});

// Deliberately narrow: only these two fields are accepted at all, so an
// adminId or userId in the body (if a caller tried) is simply stripped —
// changeAdminPassword only ever reads req.user for whose account this is.
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
