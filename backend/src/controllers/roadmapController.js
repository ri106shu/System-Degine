import asyncHandler from '../utils/asyncHandler.js';
import * as roadmapService from '../services/roadmapService.js';

// GET /api/roadmaps?module=lld|hld
export const getRoadmaps = asyncHandler(async (req, res) => {
  const moduleSlug = req.query.module === 'hld' ? 'hld' : 'lld';
  const roadmaps = await roadmapService.listRoadmaps({ userId: req.user._id, moduleSlug });
  res.json({ success: true, data: { roadmaps } });
});

// GET /api/roadmaps/:id
export const getRoadmapById = asyncHandler(async (req, res) => {
  const detail = await roadmapService.getRoadmapDetail(req.params.id, req.user._id);
  res.json({ success: true, data: detail });
});
