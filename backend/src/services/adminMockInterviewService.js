import MockInterview from '../models/MockInterview.js';
import ApiError from '../utils/ApiError.js';
import { logAdminAction } from '../utils/auditLog.js';

const DATE_RANGE_MS = {
  today: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

// Shared by list, summary, and delete-all — module/difficulty/date apply to
// all three; status and search are optional additions layered on top, so
// summary can use the base filter alone (its purpose is to show the status
// breakdown a status filter would otherwise hide) while list and
// delete-all use the full filter, guaranteeing "delete all" can never
// target a different set of documents than what "view all" is currently
// showing — they're built by the exact same function.
const buildBaseFilter = ({ module, difficulty, dateRange }) => {
  const filter = {};
  if (module && module !== 'all') filter.mode = module;
  if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
  if (dateRange && dateRange !== 'all' && DATE_RANGE_MS[dateRange]) {
    filter.startedAt = { $gte: new Date(Date.now() - DATE_RANGE_MS[dateRange]) };
  }
  return filter;
};

// A search term matches by user name/email — the only thing a monitoring
// admin would plausibly search by, since interview content is per-item
// snapshots, not a single searchable field. Resolved to a set of userIds
// first so the main query stays a single, indexable match on _id/userId
// rather than a cross-collection $lookup for every page of results.
const buildFullFilter = async ({ module, status, difficulty, dateRange, search }) => {
  const filter = buildBaseFilter({ module, difficulty, dateRange });
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const User = (await import('../models/User.js')).default;
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchingUsers = await User.find({ $or: [{ name: re }, { email: re }] }).select('_id');
    filter.userId = { $in: matchingUsers.map((u) => u._id) };
  }
  return filter;
};

const SORT_MAP = {
  newest: '-startedAt',
  oldest: 'startedAt',
  duration: '-totalTimeSpentSeconds',
  status: 'status',
};

export const getAdminMockInterviewList = async ({
  module,
  status,
  difficulty,
  dateRange,
  search,
  sort = 'newest',
  page = 1,
  limit = 20,
} = {}) => {
  const filter = await buildFullFilter({ module, status, difficulty, dateRange, search });

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;
  const sortSpec = SORT_MAP[sort] || SORT_MAP.newest;

  const [interviews, total] = await Promise.all([
    MockInterview.find(filter)
      .select('userId mode type difficulty status totalTimeSpentSeconds startedAt completedAt abandonedAt questions topicPrompts')
      .sort(sortSpec)
      .skip(skip)
      .limit(safeLimit)
      .populate('userId', 'name email'),
    MockInterview.countDocuments(filter),
  ]);

  const list = interviews.map((m) => ({
    _id: m._id,
    user: m.userId ? { name: m.userId.name, email: m.userId.email } : null,
    mode: m.mode,
    type: m.type,
    difficulty: m.difficulty,
    status: m.status,
    durationSeconds: m.totalTimeSpentSeconds,
    itemCount: (m.questions?.length || 0) + (m.topicPrompts?.length || 0),
    startedAt: m.startedAt,
    completedAt: m.completedAt,
  }));

  return { interviews: list, total, page: safePage, limit: safeLimit, totalPages: Math.max(Math.ceil(total / safeLimit), 1) };
};

// Summary respects module/difficulty/date but never status — that's the
// breakdown being shown, not a filter to apply before computing it.
export const getAdminMockInterviewSummary = async ({ module, difficulty, dateRange } = {}) => {
  const filter = buildBaseFilter({ module, difficulty, dateRange });

  const [total, completed, inProgress, abandoned, lld, hld, mixed, completedDurations] = await Promise.all([
    MockInterview.countDocuments(filter),
    MockInterview.countDocuments({ ...filter, status: 'completed' }),
    MockInterview.countDocuments({ ...filter, status: 'in_progress' }),
    MockInterview.countDocuments({ ...filter, status: 'abandoned' }),
    MockInterview.countDocuments({ ...filter, mode: 'lld' }),
    MockInterview.countDocuments({ ...filter, mode: 'hld' }),
    MockInterview.countDocuments({ ...filter, mode: 'mixed' }),
    MockInterview.find({ ...filter, status: 'completed' }).select('totalTimeSpentSeconds'),
  ]);

  const avgDurationSeconds =
    completedDurations.length > 0
      ? Math.round(completedDurations.reduce((sum, m) => sum + (m.totalTimeSpentSeconds || 0), 0) / completedDurations.length)
      : 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    abandoned,
    byMode: { lld, hld, mixed },
    avgDurationSeconds,
    completionRate,
  };
};

export const getAdminMockInterviewDetail = async (id) => {
  const mock = await MockInterview.findById(id).populate('userId', 'name email');
  if (!mock) return null;

  const items = mock.type === 'topic' ? mock.topicPrompts : mock.questions;
  const topicsCovered = [...new Set(items.map((i) => i.topicSnapshot))];
  const difficultyBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
  for (const item of items) {
    if (item.difficultySnapshot in difficultyBreakdown) difficultyBreakdown[item.difficultySnapshot] += 1;
  }

  return {
    _id: mock._id,
    user: mock.userId ? { name: mock.userId.name, email: mock.userId.email } : null,
    mode: mock.mode,
    type: mock.type,
    difficulty: mock.difficulty,
    durationMode: mock.durationMode,
    status: mock.status,
    startedAt: mock.startedAt,
    completedAt: mock.completedAt,
    abandonedAt: mock.abandonedAt,
    totalTimeSpentSeconds: mock.totalTimeSpentSeconds,
    // Never fabricated: null unless a real scoring mechanism has actually
    // set it, which nothing in this codebase does yet — shown as "not
    // scored" by the frontend rather than a number, exactly because there
    // is no number to show.
    totalScore: mock.totalScore,
    itemCount: items.length,
    topicsCovered,
    difficultyBreakdown,
    items: items.map((i) => ({
      title: i.titleSnapshot || i.promptSnapshot,
      topic: i.topicSnapshot,
      difficulty: i.difficultySnapshot,
      itemStatus: i.itemStatus,
      timeSpentSeconds: i.timeSpentSeconds,
    })),
  };
};

// A real, permanent delete of the same MockInterview document the user's
// own Mock History reads from — there is no separate admin-side copy of
// this data, so removing it here removes it everywhere it's shown,
// including that user's history. This mirrors the existing user-facing
// deleteMock (also a hard delete, MockInterview has no isActive/soft-delete
// field to fall back on) but without the userId ownership restriction,
// since an admin needs to be able to remove any user's mock, not just
// their own.
export const deleteAdminMockInterview = async (id, adminUser) => {
  const mock = await MockInterview.findById(id).populate('userId', 'name email');
  if (!mock) throw new ApiError(404, 'Mock interview not found');

  const ownerLabel = mock.userId ? `${mock.userId.name} (${mock.userId.email})` : 'an unknown user';
  const itemCount = (mock.questions?.length || 0) + (mock.topicPrompts?.length || 0);

  await MockInterview.deleteOne({ _id: id });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_MOCK_INTERVIEW',
    targetType: 'mockInterview',
    targetId: mock._id,
    description: `Deleted a ${mock.mode.toUpperCase()} mock interview belonging to ${ownerLabel}`,
    metadata: { owner: mock.userId?._id, mode: mock.mode, status: mock.status, itemCount },
  });

  return { deletedId: mock._id };
};

// Bulk delete — built from the exact same buildFullFilter() the list uses,
// so this can never target a set of documents different from what the
// admin is currently looking at. Deliberately requires at least one real
// filter or an explicit confirm flag (see the controller) rather than
// silently accepting an empty filter as "delete everything" by default —
// the empty-filter case is legitimate (an admin who genuinely wants to
// clear all mock interview history) but must be an unambiguous choice, not
// what happens when a param is merely omitted.
export const deleteAllAdminMockInterviews = async ({ module, status, difficulty, dateRange, search }, adminUser) => {
  const filter = await buildFullFilter({ module, status, difficulty, dateRange, search });

  const targets = await MockInterview.find(filter).select('userId').lean();
  if (targets.length === 0) return { deletedCount: 0 };

  const distinctUserCount = new Set(targets.map((t) => (t.userId ? t.userId.toString() : 'unknown'))).size;
  const { deletedCount } = await MockInterview.deleteMany(filter);

  await logAdminAction({
    adminUser,
    action: 'ADMIN_BULK_DELETED_MOCK_INTERVIEWS',
    targetType: 'mockInterview',
    targetId: null,
    description: `Bulk-deleted ${deletedCount} mock interview${deletedCount === 1 ? '' : 's'} across ${distinctUserCount} user${distinctUserCount === 1 ? '' : 's'}`,
    metadata: { filter: { module, status, difficulty, dateRange, search }, deletedCount, distinctUserCount },
  });

  return { deletedCount };
};
