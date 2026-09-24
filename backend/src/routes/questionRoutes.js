import express from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import checkModuleEnabled from '../middleware/checkModuleEnabled.js';
import { createQuestionSchema, updateQuestionSchema } from '../validators/questionValidators.js';

const router = express.Router();

router.get('/', protect, checkModuleEnabled(), getQuestions);
router.get('/:id', protect, getQuestionById);
router.post('/', protect, validate(createQuestionSchema), createQuestion);
router.patch('/:id', protect, validate(updateQuestionSchema), updateQuestion);
router.delete('/:id', protect, deleteQuestion);

export default router;
