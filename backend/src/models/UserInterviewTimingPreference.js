import mongoose from 'mongoose';

// null means "no override — use the system default," not "zero minutes."
// A user who has never touched their timing settings has no document at
// all here (see timingService.getResolvedTiming), and a user who has
// touched some values but not others keeps the rest null rather than
// silently copying the current default into their document, which would
// freeze them onto today's default even after a system default changes.
const overrideTiersSchema = new mongoose.Schema(
  {
    easy: { type: Number, default: null },
    medium: { type: Number, default: null },
    hard: { type: Number, default: null },
  },
  { _id: false }
);

const moduleOverridesSchema = new mongoose.Schema(
  {
    topic: { type: overrideTiersSchema, default: () => ({}) },
    question: { type: overrideTiersSchema, default: () => ({}) },
  },
  { _id: false }
);

const userInterviewTimingPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lld: { type: moduleOverridesSchema, default: () => ({}) },
    hld: { type: moduleOverridesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model('UserInterviewTimingPreference', userInterviewTimingPreferenceSchema);
