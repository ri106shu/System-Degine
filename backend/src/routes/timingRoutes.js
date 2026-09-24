import express from 'express';
import { getInterviewTiming, updateInterviewTiming, resetInterviewTiming } from '../controllers/timingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateTimingSchema } from '../validators/timingValidators.js';

const router = express.Router();

router.get('/', protect, getInterviewTiming);
router.patch('/', protect, validate(updateTimingSchema), updateInterviewTiming);
router.post('/reset', protect, resetInterviewTiming);

export default router;
