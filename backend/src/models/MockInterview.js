import mongoose from 'mongoose';

// Embedded, not a top-level collection — a mock question result has no
// existence independent of the mock it belongs to. Snapshots (title/topic/
// module/difficulty) are captured at creation time so a mock's history stays
// intact even if the source Topic/Question is later edited or soft-deleted.
const mockQuestionResultSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    titleSnapshot: { type: String, required: true },
    topicSnapshot: { type: String, required: true },
    moduleSnapshot: { type: String, enum: ['lld', 'hld'], required: true },
    difficultySnapshot: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    // Resolved once at mock-creation time (this user's override, or the
    // system default, for this exact module/type/difficulty) and never
    // recalculated later — section 18: the history must keep recording
    // what was actually selected, even if the user's settings change
    // afterward.
    selectedDurationSeconds: { type: Number, required: true },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    itemStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'timed_out'], default: 'pending' },
    answer: { type: String, default: '' },
    score: { type: Number, default: null },
    feedback: { type: String, default: '' },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

// The topic-interview counterpart to mockQuestionResultSchema — same
// snapshot-at-creation reasoning, but carrying a conceptual prompt (and its
// follow-ups) rather than a design question.
const mockTopicPromptResultSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    topicSnapshot: { type: String, required: true },
    promptSnapshot: { type: String, required: true },
    followUpsSnapshot: { type: [String], default: [] },
    moduleSnapshot: { type: String, enum: ['lld', 'hld'], required: true },
    difficultySnapshot: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    selectedDurationSeconds: { type: Number, required: true },
    startedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    itemStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'timed_out'], default: 'pending' },
    answer: { type: String, default: '' },
    score: { type: Number, default: null },
    feedback: { type: String, default: '' },
    timeSpentSeconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mode: { type: String, enum: ['lld', 'hld', 'mixed'], required: true },
    // 'question' (the original, default) walks through completed Question
    // records — solve-a-design-problem. 'topic' walks through completed
    // Topics via their TopicInterviewPrompt — conceptual understanding.
    // Exactly one of `questions`/`topicPrompts` is populated, matching type.
    type: { type: String, enum: ['question', 'topic'], default: 'question' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
    // 'auto' resolved each item's duration from timing config/preferences;
    // 'custom' means the whole mock used one caller-chosen total instead
    // (section 30) — kept for display in history, not for re-deriving
    // anything, since selectedDurationSeconds on each item is already final.
    durationMode: { type: String, enum: ['auto', 'custom'], default: 'auto' },
    duration: { type: Number, required: true }, // minutes — kept for backward compatibility with existing history views; totalEstimatedSeconds is the precise figure
    totalEstimatedSeconds: { type: Number, default: 0 },
    questions: { type: [mockQuestionResultSchema], default: [] },
    topicPrompts: { type: [mockTopicPromptResultSchema], default: [] },
    // 'in_progress' the instant a session is created (section 8 of the
    // brief — the backend creates it eagerly, not after the interview
    // finishes). 'timed_out' at the session level is deliberately not a
    // status here — a single item can time out (itemStatus) without ending
    // the whole session; the session only becomes 'completed' or
    // 'abandoned'.
    status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
    currentQuestionIndex: { type: Number, default: 0 },
    totalScore: { type: Number, default: null },
    totalTimeSpentSeconds: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    abandonedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mockInterviewSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('MockInterview', mockInterviewSchema);
