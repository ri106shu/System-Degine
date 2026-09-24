import mongoose from 'mongoose';

const roadmapWeekSchema = new mongoose.Schema(
  {
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A week is identified by (roadmapId, weekNumber) for idempotent seeding —
// never by title, which is free text and can be edited.
roadmapWeekSchema.index({ roadmapId: 1, weekNumber: 1 }, { unique: true });

export default mongoose.model('RoadmapWeek', roadmapWeekSchema);
