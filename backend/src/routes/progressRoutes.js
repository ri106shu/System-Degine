import express from 'express';
import {
  getTopicProgress,
  getQuestionProgress,
  getRoadmapProgress,
  updateTopicProgress,
  updateQuestionProgress,
  updateRoadmapProgress,
} from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateProgressSchema } from '../validators/progressValidators.js';

const router = express.Router();

router.get('/topics', protect, getTopicProgress);
router.get('/questions', protect, getQuestionProgress);
router.get('/roadmap', protect, getRoadmapProgress);
router.patch('/topic/:id', protect, validate(updateProgressSchema), updateTopicProgress);
router.patch('/question/:id', protect, validate(updateProgressSchema), updateQuestionProgress);
router.patch('/roadmap/:id', protect, validate(updateProgressSchema), updateRoadmapProgress);

export default router;
