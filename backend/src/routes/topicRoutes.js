import express from 'express';
import {
  getTopics,
  getTopicById,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topicController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import checkModuleEnabled from '../middleware/checkModuleEnabled.js';
import { createTopicSchema, updateTopicSchema } from '../validators/topicValidators.js';

const router = express.Router();

router.get('/', protect, checkModuleEnabled(), getTopics);
router.get('/:id', protect, getTopicById);
router.post('/', protect, validate(createTopicSchema), createTopic);
router.patch('/:id', protect, validate(updateTopicSchema), updateTopic);
router.delete('/:id', protect, deleteTopic);

export default router;
