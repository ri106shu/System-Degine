import asyncHandler from '../utils/asyncHandler.js';
import * as progressService from '../services/progressService.js';
import * as achievementService from '../services/achievementService.js';
import RoadmapDay from '../models/RoadmapDay.js';
import ApiError from '../utils/ApiError.js';

// Only runs the achievement evaluation when this update actually completed
// something — an 'in_progress' update or a no-op can't unlock anything, so
// there's no reason to pay for the extra queries on every single request.
const checkAchievements = async (userId, status) => {
  if (status !== 'completed') return undefined;
  const { newlyUnlocked } = await achievementService.evaluateAchievements(userId);
  return newlyUnlocked.length > 0 ? newlyUnlocked : undefined;
};

// GET /api/progress/topics
export const getTopicProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getProgressMap(req.user._id, 'topic');
  res.json({ success: true, data: { progress } });
});

// GET /api/progress/questions
export const getQuestionProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getProgressMap(req.user._id, 'question');
  res.json({ success: true, data: { progress } });
});

// GET /api/progress/roadmap
export const getRoadmapProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.getProgressMap(req.user._id, 'roadmap');
  res.json({ success: true, data: { progress } });
});

// PATCH /api/progress/topic/:id
// Section 31: "Backend must always use authenticated user ID. Never accept
// userId from frontend." req.body is never trusted for who this is for.
export const updateTopicProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.upsertProgress({
    userId: req.user._id,
    targetType: 'topic',
    targetId: req.params.id,
    ...req.body,
  });
  const newAchievements = await checkAchievements(req.user._id, progress.status);
  res.json({ success: true, data: { progress, newAchievements } });
});

// PATCH /api/progress/question/:id
export const updateQuestionProgress = asyncHandler(async (req, res) => {
  const progress = await progressService.upsertProgress({
    userId: req.user._id,
    targetType: 'question',
    targetId: req.params.id,
    ...req.body,
  });
  const newAchievements = await checkAchievements(req.user._id, progress.status);
  res.json({ success: true, data: { progress, newAchievements } });
});

// PATCH /api/progress/roadmap/:id
// Rest days never carry a completion status — enforced here, not just by
// omitting the button in the UI, since a request can always be sent by hand.
export const updateRoadmapProgress = asyncHandler(async (req, res) => {
  const day = await RoadmapDay.findOne({ _id: req.params.id, isActive: true });
  if (!day) throw new ApiError(404, 'Roadmap day not found');
  if (day.dayType === 'rest') {
    throw new ApiError(400, 'Rest days do not track completion status');
  }
  const progress = await progressService.upsertProgress({
    userId: req.user._id,
    targetType: 'roadmap',
    targetId: req.params.id,
    ...req.body,
  });
  const newAchievements = await checkAchievements(req.user._id, progress.status);
  res.json({ success: true, data: { progress, newAchievements } });
});
