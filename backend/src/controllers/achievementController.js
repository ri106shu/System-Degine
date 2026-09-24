import asyncHandler from '../utils/asyncHandler.js';
import * as achievementService from '../services/achievementService.js';

// GET /api/achievements
export const getAchievements = asyncHandler(async (req, res) => {
  const { achievements } = await achievementService.evaluateAchievements(req.user._id);
  res.json({ success: true, data: { achievements } });
});

// GET /api/achievements/stats
export const getAchievementStats = asyncHandler(async (req, res) => {
  const stats = await achievementService.getAchievementStats(req.user._id);
  res.json({ success: true, data: stats });
});
