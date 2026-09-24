import mongoose from 'mongoose';

const roadmapDaySchema = new mongoose.Schema(
  {
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    weekId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadmapWeek', required: true },
    dayNumber: { type: Number, required: true }, // global 1..N across the whole roadmap
    title: { type: String, required: true, trim: true },
    focus: { type: String, default: '' },
    // Free text on purpose — the source material isn't uniformly numeric
    // ("Self-practice", "~40m x2", "Flexible" sit alongside "25m + 54m").
    // Forcing a numeric-minutes field would mean lossily reinterpreting
    // text that was never a clean number to begin with.
    time: { type: String, default: '' },
    dayType: { type: String, enum: ['study', 'rest'], default: 'study' },
    order: { type: Number, required: true },
    // Additive field for the admin editor's Notes field — safe default so
    // every existing seeded day, which predates this field, stays valid.
    notes: { type: String, default: '' },
    // Optional, per section 48 — a day may reference the Topics/Questions
    // it maps to, but the roadmap must work with these empty.
    topicIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Topic', default: [] },
    questionIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Question', default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['system', 'user'], default: 'system' },
  },
  { timestamps: true }
);

// A day is identified by (roadmapId, dayNumber) for idempotent seeding —
// never by title, which is free text.
roadmapDaySchema.index({ roadmapId: 1, dayNumber: 1 }, { unique: true });
roadmapDaySchema.index({ weekId: 1, order: 1 });

export default mongoose.model('RoadmapDay', roadmapDaySchema);
