import asyncHandler from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboardService.js';
import * as analyticsService from '../services/analyticsService.js';

// GET /api/analytics/dashboard — pre-existing, unchanged
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user);
  res.json({ success: true, data });
});

// GET /api/analytics?module=lld|hld|all&range=7d|30d|90d|all
// userId always comes from the authenticated session — never accepted from
// the query string, so there is no way to request another user's analytics
// by changing a parameter.
export const getAnalytics = asyncHandler(async (req, res) => {
  const module = ['lld', 'hld'].includes(req.query.module) ? req.query.module : 'all';
  const range = ['7d', '30d', '90d'].includes(req.query.range) ? req.query.range : 'all';
  const data = await analyticsService.getAnalytics(req.user._id, { module, range });
  res.json({ success: true, data });
});
