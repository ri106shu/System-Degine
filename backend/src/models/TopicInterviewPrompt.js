import mongoose from 'mongoose';

// Deliberately its own collection, not rows in Question — a topic prompt
// tests conceptual understanding ("What is Abstraction?"); a Question tests
// solving a design problem ("Design a Parking Lot"). Conflating them into
// one collection would make it impossible to keep the two interview
// experiences distinct, which is the entire point of this model existing.
const topicInterviewPromptSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    prompt: { type: String, required: true, trim: true },
    followUps: { type: [String], default: [] },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    source: { type: String, enum: ['system', 'user'], default: 'system' },
  },
  { timestamps: true }
);

// One prompt per topic for now (the seed's "at least one" floor) — not a
// uniqueness constraint the schema enforces, since a topic could reasonably
// gain a second, alternate prompt later without this needing to change.
topicInterviewPromptSchema.index({ topicId: 1 });
topicInterviewPromptSchema.index({ moduleId: 1, isActive: 1 });

export default mongoose.model('TopicInterviewPrompt', topicInterviewPromptSchema);
