import express from 'express';
import { getDashboardAnalytics, getAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/', protect, getAnalytics);

export default router;
