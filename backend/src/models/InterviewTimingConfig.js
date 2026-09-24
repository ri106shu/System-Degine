import mongoose from 'mongoose';

// {min, max, default} minutes for one difficulty tier.
const tierSchema = new mongoose.Schema(
  { minMinutes: { type: Number, required: true }, maxMinutes: { type: Number, required: true }, defaultMinutes: { type: Number, required: true } },
  { _id: false }
);

const difficultyTiersSchema = new mongoose.Schema(
  { easy: { type: tierSchema, required: true }, medium: { type: tierSchema, required: true }, hard: { type: tierSchema, required: true } },
  { _id: false }
);

// Guidance only (section 21/22 of the brief) — never enforced, and the
// third phase for a tier is intentionally omitted (not zero) when it's
// meant to be "whatever time is left," so the resolver can compute it
// relative to whatever total duration was actually chosen, not just the
// default. Field name is "walkthrough" for every tier — the source material
// calls it "Explanation" specifically for the hard tier, same concept.
const phaseGuidanceSchema = new mongoose.Schema(
  {
    designMinutes: { type: Number, default: null },
    codingMinutes: { type: Number, default: null },
    walkthroughMinutes: { type: Number, default: null },
  },
  { _id: false }
);

// One model for both modules, distinguished by `module` — no
// LLDTimingConfig/HLDTimingConfig split, matching every other pair in this
// app. Purely system-level: there is no source/createdBy here, because a
// user never creates their own config document — their customization lives
// entirely in UserInterviewTimingPreference instead.
const interviewTimingConfigSchema = new mongoose.Schema(
  {
    module: { type: String, enum: ['lld', 'hld'], required: true, unique: true },
    topic: { type: difficultyTiersSchema, required: true },
    question: { type: difficultyTiersSchema, required: true },
    questionPhases: {
      easy: { type: phaseGuidanceSchema, default: () => ({}) },
      medium: { type: phaseGuidanceSchema, default: () => ({}) },
      hard: { type: phaseGuidanceSchema, default: () => ({}) },
    },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewTimingConfig', interviewTimingConfigSchema);
