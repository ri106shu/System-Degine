import asyncHandler from '../utils/asyncHandler.js';
import * as timingService from '../services/timingService.js';

// GET /api/interview-timing
export const getInterviewTiming = asyncHandler(async (req, res) => {
  const timing = await timingService.getResolvedTiming(req.user._id);
  res.json({ success: true, data: timing });
});

// PATCH /api/interview-timing
export const updateInterviewTiming = asyncHandler(async (req, res) => {
  await timingService.updateUserTimingPreference(req.user._id, req.body);
  const timing = await timingService.getResolvedTiming(req.user._id);
  res.json({ success: true, data: timing });
});

// POST /api/interview-timing/reset — section 41, scoped to one module
export const resetInterviewTiming = asyncHandler(async (req, res) => {
  const module = req.body.module === 'hld' ? 'hld' : 'lld';
  await timingService.resetUserTimingToDefault(req.user._id, module);
  const timing = await timingService.getResolvedTiming(req.user._id);
  res.json({ success: true, data: timing });
});
