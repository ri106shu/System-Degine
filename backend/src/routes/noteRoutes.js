import express from 'express';
import { getNotes, getNote, getNoteForTarget, createNote, updateNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createNoteSchema, updateNoteSchema } from '../validators/noteValidators.js';

const router = express.Router();

// Every route here is a logged-in user's own notes — there is no admin or
// cross-user view of this data anywhere. protect() attaches req.user from
// the JWT; every service call below uses req.user._id, never anything the
// client could supply in a body or query string.
router.use(protect);

router.get('/', getNotes);
router.get('/target/:targetType/:targetId', getNoteForTarget);
router.post('/', validate(createNoteSchema), createNote);
router.get('/:id', getNote);
router.patch('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);

export default router;
