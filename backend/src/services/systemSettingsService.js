import SystemSettings, { SYSTEM_SETTINGS_ID } from '../models/SystemSettings.js';
import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';
import Roadmap from '../models/Roadmap.js';
import Note from '../models/Note.js';
import MockInterview from '../models/MockInterview.js';
import ApiError from '../utils/ApiError.js';
import { logAdminAction } from '../utils/auditLog.js';

// The one place that resolves the singleton — creates it with schema
// defaults on first access rather than requiring a seed step, so a fresh
// install works immediately without an extra manual setup action.
export const getOrCreateSettings = async () => {
  let settings = await SystemSettings.findById(SYSTEM_SETTINGS_ID);
  if (!settings) {
    settings = await SystemSettings.create({ _id: SYSTEM_SETTINGS_ID });
  }
  return settings;
};

export const getSettings = async () => {
  const settings = await getOrCreateSettings();
  return settings.toObject();
};

export const updatePlatformSettings = async ({ name, description }, adminUser) => {
  const settings = await getOrCreateSettings();
  const changed = {};
  if (name !== undefined && name.trim() !== settings.platform.name) {
    changed.name = { from: settings.platform.name, to: name.trim() };
    settings.platform.name = name.trim();
  }
  if (description !== undefined && description !== settings.platform.description) {
    changed.description = { from: settings.platform.description, to: description };
    settings.platform.description = description;
  }
  if (Object.keys(changed).length === 0) return settings.toObject();

  settings.updatedBy = adminUser._id;
  await settings.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_PLATFORM_SETTINGS',
    targetType: 'systemSettings',
    targetId: null,
    description: `Updated platform settings (${Object.keys(changed).join(', ')})`,
    metadata: { changed },
  });

  return settings.toObject();
};

// Each module toggle gets its own audit action (ADMIN_ENABLED_MODULE /
// ADMIN_DISABLED_MODULE) per the brief, rather than folding both into one
// generic "settings updated" entry — the direction of the change is
// exactly the thing worth being able to find in the log later.
export const updateModuleSettings = async ({ lldEnabled, hldEnabled }, adminUser) => {
  const settings = await getOrCreateSettings();
  const events = [];

  if (lldEnabled !== undefined && lldEnabled !== settings.modules.lldEnabled) {
    events.push({ module: 'LLD', enabled: lldEnabled });
    settings.modules.lldEnabled = lldEnabled;
  }
  if (hldEnabled !== undefined && hldEnabled !== settings.modules.hldEnabled) {
    events.push({ module: 'HLD', enabled: hldEnabled });
    settings.modules.hldEnabled = hldEnabled;
  }
  if (events.length === 0) return settings.toObject();

  settings.updatedBy = adminUser._id;
  await settings.save();

  for (const event of events) {
    await logAdminAction({
      adminUser,
      action: event.enabled ? 'ADMIN_ENABLED_MODULE' : 'ADMIN_DISABLED_MODULE',
      targetType: 'systemSettings',
      targetId: null,
      description: `${event.enabled ? 'Enabled' : 'Disabled'} the ${event.module} module`,
      metadata: { module: event.module },
    });
  }

  return settings.toObject();
};

// Verifies the admin's CURRENT password against their own account (never
// trusts an admin id from the request body — always req.user, the
// authenticated caller) before allowing a change. Reuses User's own
// pre-save hashing hook and comparePassword method rather than
// reimplementing password handling here.
export const changeAdminPassword = async (adminUser, { currentPassword, newPassword }) => {
  const user = await User.findById(adminUser._id).select('+password');
  if (!user) throw new ApiError(404, 'Account not found');

  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    throw new ApiError(400, 'Current password is incorrect', [{ field: 'currentPassword', message: 'Current password is incorrect' }]);
  }

  user.password = newPassword; // hashed by User's own pre-save hook
  await user.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CHANGED_PASSWORD',
    targetType: 'user',
    targetId: adminUser._id,
    description: 'Changed their own admin account password',
    // Deliberately no metadata at all here — nothing about a password,
    // even indirectly, belongs in a log a wider audience might read.
  });

  return { success: true };
};

export const getDatabaseStats = async () => {
  const [topics, questions, prompts, roadmaps, notes, mocks] = await Promise.all([
    Topic.countDocuments({ isActive: true }),
    Question.countDocuments({ isActive: true }),
    TopicInterviewPrompt.countDocuments({ isActive: true }),
    Roadmap.countDocuments({ isActive: true }),
    Note.countDocuments({}),
    MockInterview.countDocuments({}),
  ]);
  return { topics, questions, topicPrompts: prompts, roadmaps, userNotes: notes, mockInterviews: mocks };
};

export const resetSettings = async (adminUser) => {
  await SystemSettings.deleteOne({ _id: SYSTEM_SETTINGS_ID });
  const fresh = await getOrCreateSettings();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_RESET_SETTINGS',
    targetType: 'systemSettings',
    targetId: null,
    description: 'Reset all platform settings to their defaults',
  });

  return fresh.toObject();
};

// Used by the module-availability enforcement middleware — a small, cheap
// read that every gated user-facing request makes once. Exported
// separately from getSettings so the middleware's intent (checking one
// module's availability) reads clearly at the call site.
export const isModuleEnabled = async (moduleSlug) => {
  const settings = await getOrCreateSettings();
  if (moduleSlug === 'lld') return settings.modules.lldEnabled;
  if (moduleSlug === 'hld') return settings.modules.hldEnabled;
  return true; // an unrecognized module slug isn't this middleware's concern
};
