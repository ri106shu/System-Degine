import asyncHandler from '../utils/asyncHandler.js';
import * as adminTopicService from '../services/adminTopicService.js';

export const getAdminTopics = asyncHandler(async (req, res) => {
  const result = await adminTopicService.getAdminTopicList({
    module: req.query.module,
    search: req.query.search,
    category: req.query.category,
    difficulty: req.query.difficulty,
    status: req.query.status,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});

export const getAdminTopic = asyncHandler(async (req, res) => {
  const topic = await adminTopicService.getAdminTopicById(req.params.id);
  res.json({ success: true, data: { topic } });
});

export const createAdminTopic = asyncHandler(async (req, res) => {
  const topic = await adminTopicService.createAdminTopic(req.body, req.user);
  res.status(201).json({ success: true, data: { topic } });
});

export const updateAdminTopic = asyncHandler(async (req, res) => {
  const topic = await adminTopicService.updateAdminTopic(req.params.id, req.body, req.user);
  res.json({ success: true, data: { topic } });
});

export const deleteAdminTopic = asyncHandler(async (req, res) => {
  const topic = await adminTopicService.deleteAdminTopic(req.params.id, req.user);
  res.json({ success: true, data: { topic } });
});

export const restoreAdminTopic = asyncHandler(async (req, res) => {
  const topic = await adminTopicService.restoreAdminTopic(req.params.id, req.user);
  res.json({ success: true, data: { topic } });
});
