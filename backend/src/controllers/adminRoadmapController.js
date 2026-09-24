import asyncHandler from '../utils/asyncHandler.js';
import * as svc from '../services/adminRoadmapService.js';

// GET /api/admin/roadmaps/module/:moduleSlug
export const getAdminRoadmapByModule = asyncHandler(async (req, res) => {
  const result = await svc.getAdminRoadmapByModule(req.params.moduleSlug);
  res.json({ success: true, data: result });
});

export const getAdminRoadmapDetail = asyncHandler(async (req, res) => {
  const result = await svc.getAdminRoadmapDetail(req.params.id);
  res.json({ success: true, data: result });
});

// POST /api/admin/roadmaps/module/:moduleSlug — the module comes from the
// URL, set by whichever admin screen (LLD or HLD) the request came from,
// never from req.body.
export const createAdminRoadmap = asyncHandler(async (req, res) => {
  const result = await svc.createAdminRoadmap(req.params.moduleSlug, req.body, req.user);
  res.status(201).json({ success: true, data: result });
});

export const updateAdminRoadmap = asyncHandler(async (req, res) => {
  const result = await svc.updateAdminRoadmap(req.params.id, req.body, req.user);
  res.json({ success: true, data: result });
});

export const toggleAdminRoadmapActive = asyncHandler(async (req, res) => {
  const result = await svc.toggleAdminRoadmapActive(req.params.id, req.body.isActive, req.user);
  res.json({ success: true, data: result });
});

export const duplicateAdminRoadmap = asyncHandler(async (req, res) => {
  const result = await svc.duplicateAdminRoadmap(req.params.id, req.user);
  res.status(201).json({ success: true, data: result });
});

export const deleteAdminRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await svc.deleteAdminRoadmap(req.params.id, req.user);
  res.json({ success: true, data: { roadmap } });
});

export const createAdminWeek = asyncHandler(async (req, res) => {
  const week = await svc.createAdminWeek(req.params.roadmapId, req.body, req.user);
  res.status(201).json({ success: true, data: { week } });
});

export const updateAdminWeek = asyncHandler(async (req, res) => {
  const week = await svc.updateAdminWeek(req.params.weekId, req.body, req.user);
  res.json({ success: true, data: { week } });
});

export const deleteAdminWeek = asyncHandler(async (req, res) => {
  const result = await svc.deleteAdminWeek(req.params.weekId, req.user);
  res.json({ success: true, data: result });
});

export const moveAdminWeek = asyncHandler(async (req, res) => {
  const week = await svc.moveAdminWeek(req.params.weekId, req.body.direction, req.user);
  res.json({ success: true, data: { week } });
});

export const createAdminDay = asyncHandler(async (req, res) => {
  const day = await svc.createAdminDay(req.params.weekId, req.body, req.user);
  res.status(201).json({ success: true, data: { day } });
});

export const updateAdminDay = asyncHandler(async (req, res) => {
  const day = await svc.updateAdminDay(req.params.dayId, req.body, req.user);
  res.json({ success: true, data: { day } });
});

export const deleteAdminDay = asyncHandler(async (req, res) => {
  const result = await svc.deleteAdminDay(req.params.dayId, req.user);
  res.json({ success: true, data: result });
});

export const moveAdminDay = asyncHandler(async (req, res) => {
  const day = await svc.moveAdminDay(req.params.dayId, req.body.direction, req.user);
  res.json({ success: true, data: { day } });
});
