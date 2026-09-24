import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';
import UserProgress from '../models/UserProgress.js';
import MockInterview from '../models/MockInterview.js';
import * as timingService from './timingService.js';
import ApiError from '../utils/ApiError.js';

const MODE_SLUGS = { lld: ['lld'], hld: ['hld'], mixed: ['lld', 'hld'] };

const resolveModuleIds = async (mode) => {
  const slugs = MODE_SLUGS[mode];
  if (!slugs) throw new ApiError(400, 'Invalid mode', [{ field: 'mode', message: 'Must be lld, hld, or mixed' }]);
  const modules = await Module.find({ slug: { $in: slugs } });
  return modules.map((m) => m._id);
};

// Two genuinely separate pools, not one generic function with a flag —
// Topic Interview tests conceptual understanding via TopicInterviewPrompt;
// Question Interview tests solving an actual design problem via Question.
// Nothing here shares eligibility logic between them beyond both starting
// from "this user's completed <targetType> progress."

// TOPIC INTERVIEW POOL — a topic is eligible once it's completed, in the
// right module, and active. No question needs to be completed for this at
// all. A completed topic with no seeded prompt yet (only possible for a
// user-created topic — every seeded system topic has one) is excluded,
// since there's nothing to ask; it isn't treated as a data error.
export const getEligibleTopicInterviewContent = async ({ userId, mode, difficulty }) => {
  const moduleIds = await resolveModuleIds(mode);

  const completedTopicProgress = await UserProgress.find({ userId, targetType: 'topic', status: 'completed' });
  const completedTopicIds = completedTopicProgress.map((p) => p.targetId);
  const completedTopics = await Topic.find({
    _id: { $in: completedTopicIds },
    moduleId: { $in: moduleIds },
    isActive: true,
  }).populate('moduleId', 'slug name');

  const promptFilter = { topicId: { $in: completedTopics.map((t) => t._id) }, isActive: true };
  if (difficulty && difficulty !== 'Mixed') promptFilter.difficulty = difficulty;
  const prompts = await TopicInterviewPrompt.find(promptFilter);
  const promptByTopicId = new Map(prompts.map((p) => [p.topicId.toString(), p]));

  const eligibleTopics = completedTopics
    .filter((t) => promptByTopicId.has(t._id.toString()))
    .map((t) => {
      const p = promptByTopicId.get(t._id.toString());
      return {
        _id: t._id,
        name: t.name,
        category: t.category,
        difficulty: p.difficulty,
        moduleId: t.moduleId,
        prompt: p.prompt,
        followUps: p.followUps,
      };
    });

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n--- TOPIC INTERVIEW ELIGIBILITY DEBUG ---');
    console.log('Mode:', mode, '| User:', userId.toString());
    console.log('Completed Topic IDs:', completedTopicIds.map((id) => id.toString()));
    console.log('Completed Topics in module:', completedTopics.map((t) => `${t.name} (${t._id})`));
    console.log('Eligible (have a prompt):', eligibleTopics.map((t) => `${t.name} (${t._id})`));
    const noPrompt = completedTopics.filter((t) => !promptByTopicId.has(t._id.toString()));
    if (noPrompt.length) console.log('Excluded — no interview prompt yet:', noPrompt.map((t) => t.name));
    console.log('--- END DEBUG ---\n');
  }

  return { eligibleTopics };
};

// QUESTION INTERVIEW POOL — a question is eligible once it's completed, in
// the right module, and active. Independent of whether its topic is
// completed (a deliberate rule change from an earlier version — see the
// README). A question's topic must still genuinely exist and be active —
// there's nothing to gate on completion-wise, but a question can't be shown
// with no valid topic to display, so a soft-deleted topic still excludes it.
export const getEligibleQuestionInterviewContent = async ({ userId, mode, difficulty }) => {
  const moduleIds = await resolveModuleIds(mode);

  const completedTopicProgress = await UserProgress.find({ userId, targetType: 'topic', status: 'completed' });
  const completedTopicIds = completedTopicProgress.map((p) => p.targetId);
  const completedTopics = await Topic.find({
    _id: { $in: completedTopicIds },
    moduleId: { $in: moduleIds },
    isActive: true,
  }).populate('moduleId', 'slug name');

  const completedQuestionProgress = await UserProgress.find({ userId, targetType: 'question', status: 'completed' });
  const completedQuestionIds = completedQuestionProgress.map((p) => p.targetId);

  const questionFilter = {
    _id: { $in: completedQuestionIds },
    moduleId: { $in: moduleIds },
    isActive: true,
  };
  if (difficulty && difficulty !== 'Mixed') questionFilter.difficulty = difficulty;

  const questionsRaw = await Question.find(questionFilter)
    .populate('moduleId', 'slug name')
    .populate({ path: 'topicId', match: { isActive: true }, select: 'name category' });
  const eligibleQuestions = questionsRaw.filter((q) => q.topicId != null);

  // Development-only trace of every ID at every handoff — kept behind
  // NODE_ENV, not deleted after use, since this class of bug (a count that
  // doesn't match the list) is much faster to diagnose with this than
  // without it.
  if (process.env.NODE_ENV !== 'production') {
    const excludedForDeletedTopic = questionsRaw.length - eligibleQuestions.length;
    console.log('\n--- QUESTION INTERVIEW ELIGIBILITY DEBUG ---');
    console.log('Mode:', mode, '| User:', userId.toString());
    console.log('Module IDs:', moduleIds.map((id) => id.toString()));
    console.log('Completed Question IDs (from UserProgress):', completedQuestionIds.map((id) => id.toString()));
    console.log('Eligible Questions (independent of topic completion):', eligibleQuestions.map((q) => `${q.title} (${q._id})`));
    if (excludedForDeletedTopic > 0) {
      console.log(`${excludedForDeletedTopic} completed question(s) excluded — their topic reference is inactive/deleted.`);
    }
    console.log('--- END DEBUG ---\n');
  }

  return { completedTopics, eligibleQuestions };
};

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Creates a real MockInterview from a pool the backend just computed itself
// — never from IDs a caller might supply. There is deliberately no code
// path anywhere in this file that reads a caller-supplied topic or question
// list. Each item's duration is resolved individually against ITS OWN
// module and difficulty (never one flat timer for a mixed-module or
// mixed-difficulty mock — section 8/31 of the brief), unless the caller
// explicitly asked for one custom duration applied to every item.
// Starts the clock on exactly the first item — the rest stay 'pending' with
// no startedAt/expiresAt until the user actually reaches them (advancing
// via the answer endpoint), not all ticking silently in the background from
// the moment the mock is created.
const activateFirstItem = (items) => {
  if (items.length === 0) return items;
  const now = new Date();
  items[0].startedAt = now;
  items[0].expiresAt = new Date(now.getTime() + items[0].selectedDurationSeconds * 1000);
  items[0].itemStatus = 'in_progress';
  return items;
};

export const createMock = async ({ userId, mode, type, difficulty, questionCount, durationMode, customDurationMinutes }) => {
  const resolveItemSeconds = async (itemModule, itemType, itemDifficulty) => {
    if (durationMode === 'custom' && customDurationMinutes) return customDurationMinutes * 60;
    return timingService.resolveDurationSeconds(userId, itemModule, itemType, itemDifficulty.toLowerCase());
  };

  if (type === 'topic') {
    const { eligibleTopics } = await getEligibleTopicInterviewContent({ userId, mode, difficulty });
    if (eligibleTopics.length === 0) {
      throw new ApiError(400, 'No eligible topics for this mode yet — complete a topic first.');
    }
    const selected = shuffle(eligibleTopics).slice(0, questionCount);

    const topicPrompts = activateFirstItem(
      await Promise.all(
        selected.map(async (t) => {
          const itemModule = t.moduleId?.slug || mode;
          const selectedDurationSeconds = await resolveItemSeconds(itemModule, 'topic', t.difficulty);
          return {
            topicId: t._id,
            topicSnapshot: t.name,
            promptSnapshot: t.prompt,
            followUpsSnapshot: t.followUps,
            moduleSnapshot: itemModule,
            difficultySnapshot: t.difficulty,
            selectedDurationSeconds,
          };
        })
      )
    );
    const totalEstimatedSeconds = topicPrompts.reduce((sum, t) => sum + t.selectedDurationSeconds, 0);

    return MockInterview.create({
      userId,
      mode,
      type: 'topic',
      difficulty: difficulty || 'Mixed',
      durationMode: durationMode === 'custom' ? 'custom' : 'auto',
      duration: Math.round(totalEstimatedSeconds / 60),
      totalEstimatedSeconds,
      status: 'in_progress',
      startedAt: new Date(),
      topicPrompts,
    });
  }

  const { eligibleQuestions } = await getEligibleQuestionInterviewContent({ userId, mode, difficulty });
  if (eligibleQuestions.length === 0) {
    throw new ApiError(400, 'No eligible questions for this mode yet — complete a question first.');
  }
  const selected = shuffle(eligibleQuestions).slice(0, questionCount);

  const questions = activateFirstItem(
    await Promise.all(
      selected.map(async (q) => {
        const itemModule = q.moduleId?.slug || mode;
        const selectedDurationSeconds = await resolveItemSeconds(itemModule, 'question', q.difficulty);
        return {
          questionId: q._id,
          titleSnapshot: q.title,
          topicSnapshot: q.topicId?.name || 'Unknown topic',
          moduleSnapshot: itemModule,
          difficultySnapshot: q.difficulty,
          selectedDurationSeconds,
        };
      })
    )
  );
  const totalEstimatedSeconds = questions.reduce((sum, q) => sum + q.selectedDurationSeconds, 0);

  return MockInterview.create({
    userId,
    mode,
    type: 'question',
    difficulty: difficulty || 'Mixed',
    durationMode: durationMode === 'custom' ? 'custom' : 'auto',
    duration: Math.round(totalEstimatedSeconds / 60),
    totalEstimatedSeconds,
    status: 'in_progress',
    startedAt: new Date(),
    questions,
  });
};

export const getMockById = async (id, userId) => {
  const mock = await MockInterview.findOne({ _id: id, userId });
  if (!mock) throw new ApiError(404, 'Mock interview not found');
  return mock;
};

export const listMocksForUser = async (userId) => MockInterview.find({ userId }).sort('-createdAt');

const itemsOf = (mock) => (mock.type === 'topic' ? mock.topicPrompts : mock.questions);

// Section 33: the backend is authoritative over timing, never the client's
// clock — an item is 'timed_out' if its expiry has actually passed by wall
// time, regardless of what the request claims, and 'completed' otherwise.
const resolveItemStatus = (item) => {
  if (item.expiresAt && new Date() > item.expiresAt) return 'timed_out';
  return 'completed';
};

const assertOwnedAndInProgress = async (sessionId, userId) => {
  const mock = await MockInterview.findOne({ _id: sessionId, userId });
  if (!mock) throw new ApiError(404, 'Mock interview not found');
  if (mock.status !== 'in_progress') throw new ApiError(400, 'This interview is no longer in progress');
  return mock;
};

// PATCH /api/mocks/:sessionId/answer — saves the answer/time for ONE
// specific item without moving currentQuestionIndex; navigation is a
// separate action (navigateToQuestion) so "save what I typed" and "which
// question am I looking at" can't be conflated into one request.
export const submitAnswer = async ({ userId, sessionId, questionIndex, answer, timeSpentSeconds }) => {
  const mock = await assertOwnedAndInProgress(sessionId, userId);
  const items = itemsOf(mock);
  if (questionIndex < 0 || questionIndex >= items.length) throw new ApiError(400, 'Invalid question index');

  const item = items[questionIndex];
  if (item.itemStatus === 'completed' || item.itemStatus === 'timed_out') {
    // Re-answering an already-finalized item (e.g. via Previous, then
    // editing) is allowed — the brief's own Previous-preserves-then-lets-you-
    // continue flow implies this — but a timed-out item cannot be revived
    // into 'completed' by re-submitting; the clock already ran out.
    if (item.itemStatus === 'timed_out') {
      item.answer = answer;
      item.timeSpentSeconds += timeSpentSeconds || 0;
      await mock.save();
      return mock;
    }
  }

  item.answer = answer;
  item.timeSpentSeconds += timeSpentSeconds || 0;
  item.itemStatus = resolveItemStatus(item);
  mock.totalTimeSpentSeconds = items.reduce((sum, it) => sum + (it.timeSpentSeconds || 0), 0);
  await mock.save();
  return mock;
};

// PATCH /api/mocks/:sessionId/navigate — moves the "current question"
// pointer. Activates the target's timer only if it's genuinely being
// visited for the first time (still 'pending'); revisiting via Previous
// never resets a timer that's already running or already finished.
export const navigateToQuestion = async ({ userId, sessionId, questionIndex }) => {
  const mock = await assertOwnedAndInProgress(sessionId, userId);
  const items = itemsOf(mock);
  if (questionIndex < 0 || questionIndex >= items.length) throw new ApiError(400, 'Invalid question index');

  const target = items[questionIndex];
  if (target.itemStatus === 'pending') {
    const now = new Date();
    target.startedAt = now;
    target.expiresAt = new Date(now.getTime() + target.selectedDurationSeconds * 1000);
    target.itemStatus = 'in_progress';
  }
  mock.currentQuestionIndex = questionIndex;
  await mock.save();
  return mock;
};

// POST /api/mocks/:sessionId/finish — saves the final answer (if supplied)
// exactly like submitAnswer, then finalizes the whole session. The brief is
// explicit that the answer must be persisted before the session is marked
// complete, not navigated away from and lost — doing both in one call,
// atomically, is what guarantees that ordering.
export const finishMock = async ({ userId, sessionId, questionIndex, answer, timeSpentSeconds }) => {
  const mock = await assertOwnedAndInProgress(sessionId, userId);
  const items = itemsOf(mock);

  if (questionIndex != null && answer !== undefined) {
    if (questionIndex < 0 || questionIndex >= items.length) throw new ApiError(400, 'Invalid question index');
    const item = items[questionIndex];
    item.answer = answer;
    item.timeSpentSeconds += timeSpentSeconds || 0;
    if (item.itemStatus !== 'timed_out') item.itemStatus = resolveItemStatus(item);
  }

  mock.status = 'completed';
  mock.completedAt = new Date();
  mock.totalTimeSpentSeconds = items.reduce((sum, it) => sum + (it.timeSpentSeconds || 0), 0);
  // No fake score: totalScore only ever comes from real per-item scores,
  // which stay null until a real evaluation mechanism exists (see the
  // README) — never averaged/invented from nulls.
  const scored = items.filter((it) => it.score != null);
  mock.totalScore = scored.length > 0 ? Math.round(scored.reduce((s, it) => s + it.score, 0) / scored.length) : null;

  await mock.save();
  return mock;
};

// POST /api/mocks/:sessionId/abandon
export const abandonMock = async (sessionId, userId) => {
  const mock = await assertOwnedAndInProgress(sessionId, userId);
  mock.status = 'abandoned';
  mock.abandonedAt = new Date();
  await mock.save();
  return mock;
};

// GET /api/mocks/history — paginated, filtered, searched. Search matches
// against the snapshotted title/topic/prompt text stored on the mock
// itself, never a live join back to Topic/Question (which may have been
// edited or deleted since — section 52 of the brief).
export const getMockHistory = async (userId, { page = 1, limit = 20, mode, type, status, difficulty, search } = {}) => {
  const filter = { userId };
  if (mode && mode !== 'all') filter.mode = mode;
  if (type && type !== 'all') filter.type = type;
  if (status && status !== 'all') filter.status = status;
  if (difficulty && difficulty !== 'all') filter.difficulty = difficulty[0].toUpperCase() + difficulty.slice(1);

  if (search) {
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [
      { 'questions.titleSnapshot': re },
      { 'questions.topicSnapshot': re },
      { 'topicPrompts.topicSnapshot': re },
      { 'topicPrompts.promptSnapshot': re },
    ];
  }

  const skip = (Math.max(page, 1) - 1) * limit;
  const [mocks, total] = await Promise.all([
    MockInterview.find(filter).sort('-createdAt').skip(skip).limit(limit),
    MockInterview.countDocuments(filter),
  ]);

  return { mocks, total, page: Math.max(page, 1), limit, totalPages: Math.max(Math.ceil(total / limit), 1) };
};

// DELETE /api/mocks/:sessionId — ownership independently verified here, not
// only by whatever the route/controller already checked, so this function
// is safe to call from anywhere without re-deriving that guarantee.
export const deleteMock = async (sessionId, userId) => {
  const mock = await MockInterview.findOne({ _id: sessionId, userId });
  if (!mock) throw new ApiError(404, 'Mock interview not found');
  await MockInterview.deleteOne({ _id: sessionId, userId });
};

// GET /api/mocks/eligibility-debug — a persistent diagnostic, not a one-off
// deleted-after-the-fix tool: a count that doesn't match a list is a shape
// of bug worth being able to check quickly. Only ever returns the
// requesting user's own data.
export const getEligibilityDebugInfo = async ({ userId, mode, type }) => {
  if (type === 'topic') {
    const moduleIds = await resolveModuleIds(mode);
    const completedTopicProgress = await UserProgress.find({ userId, targetType: 'topic', status: 'completed' });
    const completedTopicIds = completedTopicProgress.map((p) => p.targetId);
    const completedTopics = await Topic.find({ _id: { $in: completedTopicIds }, moduleId: { $in: moduleIds }, isActive: true });
    const { eligibleTopics } = await getEligibleTopicInterviewContent({ userId, mode });
    return {
      completedTopicCount: completedTopics.length,
      eligibleTopicCount: eligibleTopics.length,
      excludedNoPromptTopicCount: completedTopics.length - eligibleTopics.length,
    };
  }

  const moduleIds = await resolveModuleIds(mode);
  const completedTopicProgress = await UserProgress.find({ userId, targetType: 'topic', status: 'completed' });
  const completedTopicIds = completedTopicProgress.map((p) => p.targetId);
  const completedTopics = await Topic.find({ _id: { $in: completedTopicIds }, moduleId: { $in: moduleIds }, isActive: true });

  const completedQuestionProgress = await UserProgress.find({ userId, targetType: 'question', status: 'completed' });
  const completedQuestionIds = completedQuestionProgress.map((p) => p.targetId);

  // All questions this user completed, in this module and active — the
  // base set eligibility should normally equal exactly, since topic
  // completion is no longer a factor.
  const completedQuestionsInModule = await Question.find({
    _id: { $in: completedQuestionIds },
    moduleId: { $in: moduleIds },
    isActive: true,
  }).select('title topicId');

  // Of those, how many have a topic reference that's inactive/deleted — the
  // one remaining reason a completed question can still be excluded.
  const topicIds = completedQuestionsInModule.map((q) => q.topicId).filter(Boolean);
  const activeTopicIdSet = new Set(
    (await Topic.find({ _id: { $in: topicIds }, isActive: true }).select('_id')).map((t) => t._id.toString())
  );
  const excludedDeletedTopicQuestionCount = completedQuestionsInModule.filter(
    (q) => !q.topicId || !activeTopicIdSet.has(q.topicId.toString())
  ).length;

  // Completed questions OUTSIDE this module — catches "I completed HLD
  // questions but I'm looking at LLD mode" style confusion.
  const completedQuestionsOutsideModule = await Question.find({
    _id: { $in: completedQuestionIds },
    moduleId: { $nin: moduleIds },
  }).countDocuments();

  const { eligibleQuestions } = await getEligibleQuestionInterviewContent({ userId, mode });

  return {
    completedTopicCount: completedTopics.length,
    completedQuestionCount: completedQuestionsInModule.length,
    eligibleQuestionCount: eligibleQuestions.length,
    excludedDeletedTopicQuestionCount,
    wrongModuleQuestionCount: completedQuestionsOutsideModule,
  };
};
