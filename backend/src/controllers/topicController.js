import asyncHandler from '../utils/asyncHandler.js';
import * as topicService from '../services/topicService.js';

// GET /api/topics?module=lld&category=SOLID
export const getTopics = asyncHandler(async (req, res) => {
  const topics = await topicService.listTopics({
    moduleSlug: req.query.module,
    category: req.query.category,
  });
  res.json({ success: true, data: { topics } });
});

// GET /api/topics/:id
export const getTopicById = asyncHandler(async (req, res) => {
  const topic = await topicService.getTopic(req.params.id);
  res.json({ success: true, data: { topic } });
});

// POST /api/topics
export const createTopic = asyncHandler(async (req, res) => {
  const topic = await topicService.createTopic(req.body, req.user);
  res.status(201).json({ success: true, data: { topic } });
});

// PATCH /api/topics/:id
export const updateTopic = asyncHandler(async (req, res) => {
  const topic = await topicService.updateTopic(req.params.id, req.body, req.user);
  res.json({ success: true, data: { topic } });
});

// DELETE /api/topics/:id
export const deleteTopic = asyncHandler(async (req, res) => {
  const { questionsDeactivated } = await topicService.deleteTopic(req.params.id, req.user);
  res.json({ success: true, data: { deleted: true, questionsDeactivated } });
});
