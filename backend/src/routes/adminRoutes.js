import express from 'express';
import { getAdminDashboard } from '../controllers/adminController.js';
import {
  getAdminTopics,
  getAdminTopic,
  createAdminTopic,
  updateAdminTopic,
  deleteAdminTopic,
  restoreAdminTopic,
} from '../controllers/adminTopicController.js';
import {
  getAdminQuestions,
  getAdminQuestion,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  restoreAdminQuestion,
} from '../controllers/adminQuestionController.js';
import {
  getAdminPrompts,
  getAdminPrompt,
  createAdminPrompt,
  updateAdminPrompt,
  deleteAdminPrompt,
  restoreAdminPrompt,
} from '../controllers/adminPromptController.js';
import {
  getAdminRoadmapByModule,
  getAdminRoadmapDetail,
  createAdminRoadmap,
  updateAdminRoadmap,
  toggleAdminRoadmapActive,
  duplicateAdminRoadmap,
  deleteAdminRoadmap,
  createAdminWeek,
  updateAdminWeek,
  deleteAdminWeek,
  moveAdminWeek,
  createAdminDay,
  updateAdminDay,
  deleteAdminDay,
  moveAdminDay,
} from '../controllers/adminRoadmapController.js';
import {
  getAdminMockInterviews,
  getAdminMockInterviewSummary,
  getAdminMockInterviewDetail,
  deleteAdminMockInterview,
  deleteAllAdminMockInterviews,
} from '../controllers/adminMockInterviewController.js';
import { getAnalytics } from '../controllers/adminAnalyticsController.js';
import { getAuditLog } from '../controllers/adminAuditLogController.js';
import { getAdminNotes, getAdminNoteStats, getAdminNote, updateAdminNote, deleteAdminNote } from '../controllers/adminNoteController.js';
import {
  getSettings,
  updatePlatformSettings,
  updateModuleSettings,
  changePassword,
  getDatabaseStats,
  resetSettings,
} from '../controllers/systemSettingsController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import { updateAdminNoteSchema } from '../validators/adminNoteValidators.js';
import { updatePlatformSettingsSchema, updateModuleSettingsSchema, changePasswordSchema } from '../validators/systemSettingsValidators.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createAdminTopicSchema, updateAdminTopicSchema } from '../validators/adminTopicValidators.js';
import { createAdminQuestionSchema, updateAdminQuestionSchema } from '../validators/adminQuestionValidators.js';
import { createAdminPromptSchema, updateAdminPromptSchema } from '../validators/adminPromptValidators.js';
import {
  createRoadmapSchema,
  updateRoadmapSchema,
  toggleActiveSchema,
  createWeekSchema,
  updateWeekSchema,
  moveSchema,
  createDaySchema,
  updateDaySchema,
} from '../validators/adminRoadmapValidators.js';

const router = express.Router();

// Every route here: authenticate first, THEN authorize — never the other
// way around, so an admin check never runs against an unauthenticated
// request. requireAdmin independently re-verifies role on every single
// request; nothing about the frontend showing or hiding admin nav is
// trusted here.
//
// User management was deliberately removed from this router (and from the
// Admin application entirely) — Admin manages platform content, not user
// accounts. See the README's Admin panel section for what that means in
// practice and why.
router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboard);

router.get('/topics', getAdminTopics);
router.post('/topics', validate(createAdminTopicSchema), createAdminTopic);
router.get('/topics/:id', getAdminTopic);
router.patch('/topics/:id', validate(updateAdminTopicSchema), updateAdminTopic);
router.delete('/topics/:id', deleteAdminTopic);
router.post('/topics/:id/restore', restoreAdminTopic);

router.get('/questions', getAdminQuestions);
router.post('/questions', validate(createAdminQuestionSchema), createAdminQuestion);
router.get('/questions/:id', getAdminQuestion);
router.patch('/questions/:id', validate(updateAdminQuestionSchema), updateAdminQuestion);
router.delete('/questions/:id', deleteAdminQuestion);
router.post('/questions/:id/restore', restoreAdminQuestion);

router.get('/topic-prompts', getAdminPrompts);
router.post('/topic-prompts', validate(createAdminPromptSchema), createAdminPrompt);
router.get('/topic-prompts/:id', getAdminPrompt);
router.patch('/topic-prompts/:id', validate(updateAdminPromptSchema), updateAdminPrompt);
router.delete('/topic-prompts/:id', deleteAdminPrompt);
router.post('/topic-prompts/:id/restore', restoreAdminPrompt);

router.get('/roadmaps/module/:moduleSlug', getAdminRoadmapByModule);
router.get('/roadmaps/:id', getAdminRoadmapDetail);
router.post('/roadmaps/module/:moduleSlug', validate(createRoadmapSchema), createAdminRoadmap);
router.patch('/roadmaps/:id', validate(updateRoadmapSchema), updateAdminRoadmap);
router.patch('/roadmaps/:id/active', validate(toggleActiveSchema), toggleAdminRoadmapActive);
router.post('/roadmaps/:id/duplicate', duplicateAdminRoadmap);
router.delete('/roadmaps/:id', deleteAdminRoadmap);

router.post('/roadmaps/:roadmapId/weeks', validate(createWeekSchema), createAdminWeek);
router.patch('/roadmap-weeks/:weekId', validate(updateWeekSchema), updateAdminWeek);
router.delete('/roadmap-weeks/:weekId', deleteAdminWeek);
router.patch('/roadmap-weeks/:weekId/move', validate(moveSchema), moveAdminWeek);

router.post('/roadmap-weeks/:weekId/days', validate(createDaySchema), createAdminDay);
router.patch('/roadmap-days/:dayId', validate(updateDaySchema), updateAdminDay);
router.delete('/roadmap-days/:dayId', deleteAdminDay);
router.patch('/roadmap-days/:dayId/move', validate(moveSchema), moveAdminDay);

router.get('/mock-interviews', getAdminMockInterviews);
router.delete('/mock-interviews', deleteAllAdminMockInterviews);
router.get('/mock-interviews/summary', getAdminMockInterviewSummary);
router.get('/mock-interviews/:id', getAdminMockInterviewDetail);
router.delete('/mock-interviews/:id', deleteAdminMockInterview);

router.get('/analytics', getAnalytics);

router.get('/audit-log', getAuditLog);

router.get('/notes', getAdminNotes);
router.get('/notes/stats', getAdminNoteStats);
router.get('/notes/:id', getAdminNote);
router.patch('/notes/:id', validate(updateAdminNoteSchema), updateAdminNote);
router.delete('/notes/:id', deleteAdminNote);

router.get('/settings', getSettings);
router.patch('/settings/platform', validate(updatePlatformSettingsSchema), updatePlatformSettings);
router.patch('/settings/modules', validate(updateModuleSettingsSchema), updateModuleSettings);
router.patch('/settings/password', validate(changePasswordSchema), changePassword);
router.get('/settings/database-stats', getDatabaseStats);
router.post('/settings/reset', resetSettings);

export default router;
