import AdminAuditLog from '../models/AdminAuditLog.js';

// The one function every admin mutation calls. Never blocks the actual
// mutation on logging succeeding — an audit-log write failing (e.g. a
// transient DB hiccup) shouldn't roll back or fail a real action like a
// role change; it's logged to the server console instead so the gap is at
// least visible operationally, matching how this app already treats
// non-critical background writes elsewhere.
export const logAdminAction = async ({ adminUser, action, targetType, targetId = null, description, metadata = {} }) => {
  try {
    await AdminAuditLog.create({
      adminUserId: adminUser._id,
      adminEmailSnapshot: adminUser.email,
      action,
      targetType,
      targetId,
      description,
      metadata,
    });
  } catch (err) {
    console.error('Failed to write admin audit log:', action, err.message);
  }
};
