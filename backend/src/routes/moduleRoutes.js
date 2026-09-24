import express from 'express';
import { getModules, getModuleById } from '../controllers/moduleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Modules are reference data, but still gated behind auth like everything
// else in the product — there's no public-facing use for them yet.
router.get('/', protect, getModules);
router.get('/:id', protect, getModuleById);

export default router;
