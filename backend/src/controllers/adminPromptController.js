import asyncHandler from '../utils/asyncHandler.js';
import * as adminPromptService from '../services/adminPromptService.js';

export const getAdminPrompts = asyncHandler(async (req, res) => {
  const result = await adminPromptService.getAdminPromptList({
    module: req.query.module,
    search: req.query.search,
    topicId: req.query.topicId,
    difficulty: req.query.difficulty,
    status: req.query.status,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});

export const getAdminPrompt = asyncHandler(async (req, res) => {
  const prompt = await adminPromptService.getAdminPromptById(req.params.id);
  res.json({ success: true, data: { prompt } });
});

export const createAdminPrompt = asyncHandler(async (req, res) => {
  const prompt = await adminPromptService.createAdminPrompt(req.body, req.user);
  res.status(201).json({ success: true, data: { prompt } });
});

export const updateAdminPrompt = asyncHandler(async (req, res) => {
  const prompt = await adminPromptService.updateAdminPrompt(req.params.id, req.body, req.user);
  res.json({ success: true, data: { prompt } });
});

export const deleteAdminPrompt = asyncHandler(async (req, res) => {
  const prompt = await adminPromptService.deleteAdminPrompt(req.params.id, req.user);
  res.json({ success: true, data: { prompt } });
});

export const restoreAdminPrompt = asyncHandler(async (req, res) => {
  const prompt = await adminPromptService.restoreAdminPrompt(req.params.id, req.user);
  res.json({ success: true, data: { prompt } });
});
