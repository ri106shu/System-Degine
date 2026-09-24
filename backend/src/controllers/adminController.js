import asyncHandler from '../utils/asyncHandler.js';
import * as adminDashboardService from '../services/adminDashboardService.js';

// GET /api/admin/dashboard
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await adminDashboardService.getAdminDashboardStats();
  res.json({ success: true, data: stats });
});
