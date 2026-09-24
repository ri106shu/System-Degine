import Module from '../models/Module.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/modules
export const getModules = asyncHandler(async (req, res) => {
  const modules = await Module.find().sort('order');
  res.json({ success: true, data: { modules } });
});

// GET /api/modules/:id
export const getModuleById = asyncHandler(async (req, res) => {
  const foundModule = await Module.findById(req.params.id);
  if (!foundModule) {
    throw new ApiError(404, 'Module not found');
  }
  res.json({ success: true, data: { module: foundModule } });
});
