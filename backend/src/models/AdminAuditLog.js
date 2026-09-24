import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmailSnapshot: { type: String, required: true }, // survives if the admin account is later edited/deleted
    action: { type: String, required: true }, // e.g. 'USER_ROLE_CHANGED', 'TOPIC_UPDATED'
    targetType: { type: String, required: true }, // 'user' | 'topic' | 'question' | 'roadmap' | ...
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description: { type: String, required: true }, // human-readable, ready to display as-is
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model('AdminAuditLog', adminAuditLogSchema);
