import asyncHandler from '../utils/asyncHandler.js';
import { getAdminAuditLogList } from '../services/adminAuditLogService.js';

export const getAuditLog = asyncHandler(async (req, res) => {
  const result = await getAdminAuditLogList({
    targetType: req.query.targetType,
    verb: req.query.verb,
    dateRange: req.query.dateRange,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});
