import AdminAuditLog from '../models/AdminAuditLog.js';

const DATE_RANGE_MS = {
  today: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

// Actions follow a consistent ADMIN_<VERB>_<NOUN> shape (see every admin
// service's logAdminAction calls), so a coarse "what kind of change"
// filter can be derived from a prefix match rather than needing the
// caller to know all 26+ exact action strings — much more usable than a
// 26-option dropdown for the same filtering power.
const VERB_PREFIXES = ['ADMIN_CREATED_', 'ADMIN_UPDATED_', 'ADMIN_DELETED_', 'ADMIN_RESTORED_', 'ADMIN_REORDERED_'];
const VERB_MAP = { created: 'ADMIN_CREATED_', updated: 'ADMIN_UPDATED_', deleted: 'ADMIN_DELETED_', restored: 'ADMIN_RESTORED_', reordered: 'ADMIN_REORDERED_' };

export const getAdminAuditLogList = async ({ targetType, verb, dateRange, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (targetType && targetType !== 'all') filter.targetType = targetType;
  if (dateRange && dateRange !== 'all' && DATE_RANGE_MS[dateRange]) {
    filter.createdAt = { $gte: new Date(Date.now() - DATE_RANGE_MS[dateRange]) };
  }

  if (verb && verb in VERB_MAP) {
    filter.action = { $regex: `^${VERB_MAP[verb]}` };
  } else if (verb === 'other') {
    // Everything that doesn't match any of the five known verb prefixes —
    // duplication, activate/deactivate, bulk delete, role changes, and
    // whatever future admin action doesn't fit the create/update/delete/
    // restore/reorder shape.
    filter.$nor = VERB_PREFIXES.map((prefix) => ({ action: { $regex: `^${prefix}` } }));
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [entries, total] = await Promise.all([
    AdminAuditLog.find(filter).sort('-createdAt').skip(skip).limit(safeLimit).lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  return {
    entries: entries.map((e) => ({
      id: e._id,
      adminEmail: e.adminEmailSnapshot,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId,
      description: e.description,
      metadata: e.metadata,
      timestamp: e.createdAt,
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
};
