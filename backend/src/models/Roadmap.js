import mongoose from 'mongoose';

// One roadmap architecture for both modules, distinguished by moduleId —
// no LLDRoadmap/HLDRoadmap split. slug is the stable identifier the seed
// upserts against (never the display title, which can change).
const roadmapSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    description: { type: String, default: '' },
    // Descriptive metadata, set from what the seed/creator actually built —
    // never trusted as the denominator for a progress calculation, which
    // always counts real RoadmapDay documents instead. See roadmapService.
    totalWeeks: { type: Number, default: 0 },
    totalStudyDays: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['system', 'user'], default: 'system' },
  },
  { timestamps: true }
);

// Partial unique index, same reasoning as Topic's: scoped by source so a
// system slug and a user's own slug never collide, and so it never rejects
// a pre-existing document from before this index existed.
roadmapSchema.index({ moduleId: 1, slug: 1, source: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true, $ne: '' } } });
roadmapSchema.index({ createdBy: 1 });

export default mongoose.model('Roadmap', roadmapSchema);
