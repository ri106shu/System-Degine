import asyncHandler from '../utils/asyncHandler.js';
import * as adminQuestionService from '../services/adminQuestionService.js';

export const getAdminQuestions = asyncHandler(async (req, res) => {
  const result = await adminQuestionService.getAdminQuestionList({
    module: req.query.module,
    search: req.query.search,
    topicId: req.query.topicId,
    difficulty: req.query.difficulty,
    type: req.query.type,
    status: req.query.status,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});

export const getAdminQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.getAdminQuestionById(req.params.id);
  res.json({ success: true, data: { question } });
});

export const createAdminQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.createAdminQuestion(req.body, req.user);
  res.status(201).json({ success: true, data: { question } });
});

export const updateAdminQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.updateAdminQuestion(req.params.id, req.body, req.user);
  res.json({ success: true, data: { question } });
});

export const deleteAdminQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.deleteAdminQuestion(req.params.id, req.user);
  res.json({ success: true, data: { question } });
});

export const restoreAdminQuestion = asyncHandler(async (req, res) => {
  const question = await adminQuestionService.restoreAdminQuestion(req.params.id, req.user);
  res.json({ success: true, data: { question } });
});
