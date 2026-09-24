import asyncHandler from '../utils/asyncHandler.js';
import * as settingsService from '../services/systemSettingsService.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  res.json({ success: true, data: { settings } });
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updatePlatformSettings(req.body, req.user);
  res.json({ success: true, data: { settings } });
});

export const updateModuleSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateModuleSettings(req.body, req.user);
  res.json({ success: true, data: { settings } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await settingsService.changeAdminPassword(req.user, req.body);
  res.json({ success: true, data: result });
});

export const getDatabaseStats = asyncHandler(async (req, res) => {
  const stats = await settingsService.getDatabaseStats();
  res.json({ success: true, data: { stats } });
});

export const resetSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.resetSettings(req.user);
  res.json({ success: true, data: { settings } });
});
