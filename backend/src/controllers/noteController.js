import asyncHandler from '../utils/asyncHandler.js';
import * as noteService from '../services/noteService.js';

export const getNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.getNoteList(req.user._id, {
    module: req.query.module,
    type: req.query.type,
    search: req.query.search,
  });
  res.json({ success: true, data: { notes } });
});

export const getNote = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.user._id, req.params.id);
  res.json({ success: true, data: { note } });
});

export const getNoteForTarget = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteByTarget(req.user._id, req.params.targetType, req.params.targetId);
  res.json({ success: true, data: { note } });
});

export const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user._id, req.body);
  res.status(201).json({ success: true, data: { note } });
});

export const updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.user._id, req.params.id, req.body);
  res.json({ success: true, data: { note } });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const result = await noteService.deleteNote(req.user._id, req.params.id);
  res.json({ success: true, data: result });
});
