import asyncHandler from '../utils/asyncHandler.js';
import * as adminNoteService from '../services/adminNoteService.js';

export const getAdminNotes = asyncHandler(async (req, res) => {
  const result = await adminNoteService.getAdminNoteList({
    module: req.query.module,
    type: req.query.type,
    userId: req.query.userId,
    dateRange: req.query.dateRange,
    search: req.query.search,
    sort: req.query.sort,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});

export const getAdminNoteStats = asyncHandler(async (req, res) => {
  const stats = await adminNoteService.getAdminNoteStats();
  res.json({ success: true, data: { stats } });
});

export const getAdminNote = asyncHandler(async (req, res) => {
  const note = await adminNoteService.getAdminNoteDetail(req.params.id);
  res.json({ success: true, data: { note } });
});

export const updateAdminNote = asyncHandler(async (req, res) => {
  const note = await adminNoteService.updateAdminNote(req.params.id, req.body, req.user);
  res.json({ success: true, data: { note } });
});

export const deleteAdminNote = asyncHandler(async (req, res) => {
  const result = await adminNoteService.deleteAdminNote(req.params.id, req.user);
  res.json({ success: true, data: result });
});
