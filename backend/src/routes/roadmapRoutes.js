import express from 'express';
import { getRoadmaps, getRoadmapById } from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';
import checkModuleEnabled from '../middleware/checkModuleEnabled.js';

const router = express.Router();

router.get('/', protect, checkModuleEnabled(), getRoadmaps);
router.get('/:id', protect, getRoadmapById);

export default router;
