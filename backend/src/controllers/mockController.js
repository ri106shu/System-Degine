import asyncHandler from '../utils/asyncHandler.js';
import * as mockService from '../services/mockService.js';
import * as achievementService from '../services/achievementService.js';

const withModule = (arr) => arr.map((item) => ({ ...(item.toObject ? item.toObject() : item), module: item.moduleId?.slug }));

// GET /api/mocks/eligible?mode=lld|hld|mixed&type=topic|question
// Two genuinely different response shapes, matching two genuinely different
// interview experiences — not one shape with unused fields depending on type.
export const getEligibleMock = asyncHandler(async (req, res) => {
  const mode = ['lld', 'hld', 'mixed'].includes(req.query.mode) ? req.query.mode : 'lld';
  const type = req.query.type === 'topic' ? 'topic' : 'question';

  if (type === 'topic') {
    const { eligibleTopics } = await mockService.getEligibleTopicInterviewContent({ userId: req.user._id, mode });
    return res.json({
      success: true,
      data: {
        mode,
        type: 'topic',
        completedTopics: eligibleTopics.length,
        eligibleTopics: eligibleTopics.length,
        topics: withModule(eligibleTopics),
      },
    });
  }

  const { completedTopics, eligibleQuestions } = await mockService.getEligibleQuestionInterviewContent({
    userId: req.user._id,
    mode,
  });
  res.json({
    success: true,
    data: {
      mode,
      type: 'question',
      completedTopics: completedTopics.length,
      eligibleQuestions: eligibleQuestions.length,
      questions: withModule(eligibleQuestions),
    },
  });
});

// POST /api/mocks
export const createMock = asyncHandler(async (req, res) => {
  const mock = await mockService.createMock({
    userId: req.user._id,
    mode: req.body.mode,
    type: req.body.type === 'topic' ? 'topic' : 'question',
    difficulty: req.body.difficulty,
    questionCount: req.body.questionCount,
    durationMode: req.body.durationMode,
    customDurationMinutes: req.body.customDurationMinutes,
  });
  res.status(201).json({ success: true, data: { mock } });
});

// GET /api/mocks
export const getMocks = asyncHandler(async (req, res) => {
  const mocks = await mockService.listMocksForUser(req.user._id);
  res.json({ success: true, data: { mocks } });
});

// GET /api/mocks/eligibility-debug?mode=lld|hld|mixed&type=topic|question
// Diagnostic breakdown of why a topic/question is or isn't eligible — see
// mockService.getEligibilityDebugInfo for what each field means.
export const getEligibilityDebug = asyncHandler(async (req, res) => {
  const mode = ['lld', 'hld', 'mixed'].includes(req.query.mode) ? req.query.mode : 'lld';
  const type = req.query.type === 'topic' ? 'topic' : 'question';
  const debug = await mockService.getEligibilityDebugInfo({ userId: req.user._id, mode, type });
  res.json({ success: true, data: { mode, type, ...debug } });
});

// GET /api/mocks/:id
export const getMockById = asyncHandler(async (req, res) => {
  const mock = await mockService.getMockById(req.params.id, req.user._id);
  res.json({ success: true, data: { mock } });
});

// PATCH /api/mocks/:id/answer
export const submitAnswer = asyncHandler(async (req, res) => {
  const mock = await mockService.submitAnswer({
    userId: req.user._id,
    sessionId: req.params.id,
    questionIndex: req.body.questionIndex,
    answer: req.body.answer,
    timeSpentSeconds: req.body.timeSpentSeconds,
  });
  res.json({ success: true, data: { mock } });
});

// PATCH /api/mocks/:id/navigate
export const navigateToQuestion = asyncHandler(async (req, res) => {
  const mock = await mockService.navigateToQuestion({
    userId: req.user._id,
    sessionId: req.params.id,
    questionIndex: req.body.questionIndex,
  });
  res.json({ success: true, data: { mock } });
});

// POST /api/mocks/:id/finish
export const finishMock = asyncHandler(async (req, res) => {
  const mock = await mockService.finishMock({
    userId: req.user._id,
    sessionId: req.params.id,
    questionIndex: req.body.questionIndex,
    answer: req.body.answer,
    timeSpentSeconds: req.body.timeSpentSeconds,
  });
  const { newlyUnlocked } = await achievementService.evaluateAchievements(req.user._id);
  res.json({ success: true, data: { mock, newAchievements: newlyUnlocked.length > 0 ? newlyUnlocked : undefined } });
});

// POST /api/mocks/:id/abandon
export const abandonMock = asyncHandler(async (req, res) => {
  const mock = await mockService.abandonMock(req.params.id, req.user._id);
  res.json({ success: true, data: { mock } });
});

// GET /api/mocks/history?page=1&limit=20&mode=lld&type=topic&status=completed&difficulty=medium&search=parking
export const getMockHistory = asyncHandler(async (req, res) => {
  const rawLimit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await mockService.getMockHistory(req.user._id, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20,
    mode: req.query.mode,
    type: req.query.type,
    status: req.query.status,
    difficulty: req.query.difficulty,
    search: req.query.search,
  });
  res.json({ success: true, data: result });
});

// DELETE /api/mocks/:id
export const deleteMock = asyncHandler(async (req, res) => {
  await mockService.deleteMock(req.params.id, req.user._id);
  res.json({ success: true, data: { deleted: true } });
});
