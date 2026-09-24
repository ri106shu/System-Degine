import mongoose from 'mongoose';

// The catalog itself (backend/src/config/achievements.js) is static code,
// not a DB collection, so this references an achievement by its stable
// `key` string rather than an ObjectId foreign key — there's no
// AchievementDefinition document to point at.
const userAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    achievementKey: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// The actual "never award the same achievement twice" guarantee — enforced
// by MongoDB itself, not just by application logic checking first.
userAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });

export default mongoose.model('UserAchievement', userAchievementSchema);
