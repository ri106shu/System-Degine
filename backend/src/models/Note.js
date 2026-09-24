import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    targetType: { type: String, enum: ['topic', 'question'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetTypeModel' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: '', maxlength: 20000 },
    // Set only when an admin corrects a note — the original userId (the
    // note's actual owner) is never touched by an admin edit. Null means
    // no admin has ever edited this note.
    lastEditedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastEditedByAdminAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Lets targetId populate against the right collection (Topic vs Question)
// without a separate lookup — Mongoose resolves refPath at query time from
// the sibling targetType-derived value below.
noteSchema.virtual('targetTypeModel').get(function () {
  return this.targetType === 'topic' ? 'Topic' : 'Question';
});

// One primary note per user per topic/question — enforced at the database
// level, not just assumed from frontend behavior. createNote() in the
// service is upsert-safe on top of this (defensive: a second create
// attempt for the same target edits the existing note rather than hitting
// this constraint as an error the user would see).
noteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
noteSchema.index({ userId: 1, moduleId: 1, targetType: 1, updatedAt: -1 });

export default mongoose.model('Note', noteSchema);
