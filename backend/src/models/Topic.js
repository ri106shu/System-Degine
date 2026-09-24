import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    name: { type: String, required: true, trim: true },
    // Stable identity for the upsert key (moduleId + slug + source) and for
    // future deep-linking. Not `required` at the schema level on purpose —
    // documents created before this field existed must stay valid; the
    // application (seed script, createTopic) always sets it going forward.
    slug: { type: String, trim: true, lowercase: true, default: '' },
    // Deliberately a plain string, not a Mongoose enum: LLD's categories
    // (OOP, SOLID, Design Patterns...) mean nothing to HLD's future
    // categories (Databases, Caching, CAP theorem...) — each module defines
    // its own, so the schema can't hardcode one module's vocabulary.
    category: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },

    // Ownership. System/seeded content has createdBy: null, source: 'system'.
    // Additive fields with safe defaults — existing seeded documents get
    // these correctly the next time `npm run seed` upserts them.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['system', 'user'], default: 'system' },

    // Soft-delete: mirrors the field Question already had. Deleting a topic
    // never hard-removes it — see topicService.deleteTopic for why.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

topicSchema.index({ moduleId: 1, category: 1, order: 1 });
topicSchema.index({ createdBy: 1 });
// Partial: only enforced where slug is actually set. A plain unique index
// would reject a second pre-existing document whose slug defaulted to ''
// (empty string collides with empty string) — this only ever activates for
// content created through application code, which always sets a real slug.
topicSchema.index(
  { moduleId: 1, slug: 1, source: 1 },
  { unique: true, partialFilterExpression: { slug: { $exists: true, $ne: '' } } }
);

export default mongoose.model('Topic', topicSchema);
