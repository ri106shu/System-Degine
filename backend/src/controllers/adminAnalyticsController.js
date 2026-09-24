import asyncHandler from '../utils/asyncHandler.js';
import { getAdminAnalytics } from '../services/adminAnalyticsService.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getAdminAnalytics(req.query.range || '30d');
  res.json({ success: true, data: analytics });
});
