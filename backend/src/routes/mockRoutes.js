import express from 'express';
import {
  getEligibleMock,
  createMock,
  getMocks,
  getMockById,
  getEligibilityDebug,
  submitAnswer,
  navigateToQuestion,
  finishMock,
  abandonMock,
  getMockHistory,
  deleteMock,
} from '../controllers/mockController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import checkModuleEnabled from '../middleware/checkModuleEnabled.js';
import { createMockSchema, submitAnswerSchema, navigateSchema, finishMockSchema } from '../validators/mockValidators.js';

const router = express.Router();

// Order matters: every literal path (/eligible, /eligibility-debug,
// /history) must be registered before the /:id family, or Express would
// try to treat "eligible"/"history" etc. as an :id value.
router.get('/eligible', protect, getEligibleMock);
router.get('/eligibility-debug', protect, getEligibilityDebug);
router.get('/history', protect, getMockHistory);
router.get('/', protect, getMocks);
router.post('/', protect, validate(createMockSchema), checkModuleEnabled('body', 'mode'), createMock);
router.get('/:id', protect, getMockById);
router.patch('/:id/answer', protect, validate(submitAnswerSchema), submitAnswer);
router.patch('/:id/navigate', protect, validate(navigateSchema), navigateToQuestion);
router.post('/:id/finish', protect, validate(finishMockSchema), finishMock);
router.post('/:id/abandon', protect, abandonMock);
router.delete('/:id', protect, deleteMock);

export default router;
