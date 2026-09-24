import asyncHandler from '../utils/asyncHandler.js';
import * as questionService from '../services/questionService.js';

// GET /api/questions?module=lld&topic=<id>&difficulty=Medium&search=parking
export const getQuestions = asyncHandler(async (req, res) => {
  const questions = await questionService.listQuestions({
    moduleSlug: req.query.module,
    topicId: req.query.topic,
    difficulty: req.query.difficulty,
    search: req.query.search,
  });
  res.json({ success: true, data: { questions } });
});

// GET /api/questions/:id — full detail, including hints and solution notes.
export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await questionService.getQuestion(req.params.id);
  res.json({ success: true, data: { question } });
});

// POST /api/questions
export const createQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.createQuestion(req.body, req.user);
  res.status(201).json({ success: true, data: { question } });
});

// PATCH /api/questions/:id
export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await questionService.updateQuestion(req.params.id, req.body, req.user);
  res.json({ success: true, data: { question } });
});

// DELETE /api/questions/:id
export const deleteQuestion = asyncHandler(async (req, res) => {
  await questionService.deleteQuestion(req.params.id, req.user);
  res.json({ success: true, data: { deleted: true } });
});
