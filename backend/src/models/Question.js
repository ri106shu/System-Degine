import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    // Matches the Mock Interview setup's "Question Type" filter (section 14
    // of the brief): Random / Design Pattern / LLD Problem / Case Study.
    type: {
      type: String,
      enum: ['Design Pattern', 'LLD Problem', 'Case Study'],
      required: true,
    },
    expectedTime: { type: Number, required: true }, // minutes
    hints: { type: [String], default: [] },
    solutionNotes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },

    // Ownership — same pattern as Topic.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['system', 'user'], default: 'system' },
  },
  { timestamps: true }
);

questionSchema.index({ moduleId: 1, topicId: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Question', questionSchema);
