import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as svc from '../services/adminMockInterviewService.js';

export const getAdminMockInterviews = asyncHandler(async (req, res) => {
  const result = await svc.getAdminMockInterviewList({
    module: req.query.module,
    status: req.query.status,
    difficulty: req.query.difficulty,
    dateRange: req.query.dateRange,
    search: req.query.search,
    sort: req.query.sort,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});

export const getAdminMockInterviewSummary = asyncHandler(async (req, res) => {
  const summary = await svc.getAdminMockInterviewSummary({
    module: req.query.module,
    difficulty: req.query.difficulty,
    dateRange: req.query.dateRange,
  });
  res.json({ success: true, data: { summary } });
});

export const getAdminMockInterviewDetail = asyncHandler(async (req, res) => {
  const detail = await svc.getAdminMockInterviewDetail(req.params.id);
  if (!detail) throw new ApiError(404, 'Mock interview not found');
  res.json({ success: true, data: { interview: detail } });
});

export const deleteAdminMockInterview = asyncHandler(async (req, res) => {
  const result = await svc.deleteAdminMockInterview(req.params.id, req.user);
  res.json({ success: true, data: result });
});

export const deleteAllAdminMockInterviews = asyncHandler(async (req, res) => {
  const result = await svc.deleteAllAdminMockInterviews(
    {
      module: req.query.module,
      status: req.query.status,
      difficulty: req.query.difficulty,
      dateRange: req.query.dateRange,
      search: req.query.search,
    },
    req.user
  );
  res.json({ success: true, data: result });
});
