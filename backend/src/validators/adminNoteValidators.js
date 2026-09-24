import { z } from 'zod';

// Deliberately narrow: only title/content are accepted fields at all — an
// admin request body can carry userId/targetType/targetId/moduleId and
// this schema will simply strip them (Zod's default is to only pass
// through known keys), so the service layer never even sees them.
export const updateAdminNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(20000).optional(),
});
