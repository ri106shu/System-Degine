import express from 'express';
import { getAchievements, getAchievementStats } from '../controllers/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Order matters: /stats must be registered before /, or it's just a normal
// sibling route here (no :id param to conflict with) — kept explicit for
// consistency with the other route files anyway.
router.get('/stats', protect, getAchievementStats);
router.get('/', protect, getAchievements);

export default router;
