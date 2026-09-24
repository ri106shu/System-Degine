import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Lowercase, matching the API contract exactly — not Mongoose refPath's
    // capitalized model-name convention. Population, where needed, is done
    // explicitly in progressService based on targetType.
    targetType: { type: String, enum: ['topic', 'question', 'roadmap'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // One status vocabulary for both topics and questions — 'completed' is
    // the shared exit-state the mock-eligibility rules key off of either
    // way. The UI maps this to "Not Started/In Progress/Completed" for
    // topics and "Not Solved/Attempted/Completed" for questions.
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    confidence: { type: Number, min: 1, max: 5, default: null },
    completedAt: { type: Date, default: null },
    timeSpent: { type: Number, default: 0 }, // minutes
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// One progress record per (user, target) — PATCH upserts against this.
userProgressSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model('UserProgress', userProgressSchema);
