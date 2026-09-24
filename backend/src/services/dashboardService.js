import mongoose from 'mongoose';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import UserProgress from '../models/UserProgress.js';
import MockInterview from '../models/MockInterview.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapDay from '../models/RoadmapDay.js';
import * as progressService from './progressService.js';

// null (not 0) means "no data" — the controller/frontend render that as
// "Not started" rather than a misleading 0%. See the brief's own rule:
// never show 0% when the denominator is 0.
export const pct = (completed, total) => (total > 0 ? Math.round((completed / total) * 100) : null);

// One aggregation per collection, not one query per module — this is what
// "avoid unnecessary database queries" means in practice here.
export const totalsByModule = async (Model) => {
  const rows = await Model.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$moduleId', count: { $sum: 1 } } },
  ]);
  const map = {};
  for (const row of rows) map[row._id.toString()] = row.count;
  return map;
};

// Completed-for-this-user, grouped by module, via a single aggregation that
// joins UserProgress to the target collection to learn its moduleId —
// UserProgress itself doesn't store moduleId, by design (it's generic over
// targetType, and duplicating moduleId onto it would be denormalization for
// no real benefit here).
export const completedByModule = async (userId, targetType, targetCollection) => {
  const rows = await UserProgress.aggregate([
    { $match: { userId, targetType, status: 'completed' } },
    {
      $lookup: {
        from: targetCollection,
        localField: 'targetId',
        foreignField: '_id',
        as: 'target',
      },
    },
    { $unwind: '$target' },
    { $match: { 'target.isActive': true } },
    { $group: { _id: '$target.moduleId', count: { $sum: 1 } } },
  ]);
  const map = {};
  for (const row of rows) map[row._id.toString()] = row.count;
  return map;
};

const moduleSection = (moduleId, topicTotals, topicCompleted, questionTotals, questionCompleted, mockStats) => {
  const key = moduleId?.toString();
  const tTotal = key ? topicTotals[key] || 0 : 0;
  const tDone = key ? topicCompleted[key] || 0 : 0;
  const qTotal = key ? questionTotals[key] || 0 : 0;
  const qDone = key ? questionCompleted[key] || 0 : 0;
  return {
    topics: { completed: tDone, total: tTotal, percentage: pct(tDone, tTotal) },
    questions: { completed: qDone, total: qTotal, percentage: pct(qDone, qTotal) },
    mocks: mockStats.count,
    averageMockScore: mockStats.averageScore,
  };
};

// Real mock counts/scores per mode, from the MockInterview collection.
// Scoped to status: 'completed' specifically — an in-progress session the
// user hasn't finished, or one they abandoned, isn't a "mock completed" and
// would otherwise inflate this count with sessions that have no real
// outcome yet. averageScore only counts mocks with a non-null totalScore
// (i.e. actually scored) — a completed-but-not-yet-scored mock still counts
// toward `count` but can't contribute to an average that doesn't exist yet.
export const mocksByMode = async (userId) => {
  const rows = await MockInterview.aggregate([
    { $match: { userId, status: 'completed' } },
    {
      $group: {
        _id: '$mode',
        count: { $sum: 1 },
        scoreSum: { $sum: { $cond: [{ $ne: ['$totalScore', null] }, '$totalScore', 0] } },
        scoredCount: { $sum: { $cond: [{ $ne: ['$totalScore', null] }, 1, 0] } },
      },
    },
  ]);
  const map = {};
  for (const row of rows) {
    map[row._id] = {
      count: row.count,
      averageScore: row.scoredCount > 0 ? Math.round(row.scoreSum / row.scoredCount) : null,
    };
  }
  return map;
};

// Same shape, grouped by type instead of mode — topic interviews
// (conceptual) vs question interviews (design problems) are a different
// axis from lld/hld/mixed, and the dashboard tracks both without either
// one replacing the other. Also scoped to completed mocks, for the same
// reason as mocksByMode above.
export const mocksByType = async (userId) => {
  const rows = await MockInterview.aggregate([
    { $match: { userId, status: 'completed' } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const map = { topic: 0, question: 0 };
  for (const row of rows) map[row._id || 'question'] = row.count;
  return map;
};

// Resolves a polymorphic (targetType, targetId) list back to display names
// in two batched queries (one per type actually present), not N+1. Also
// resolves each target's module to its slug ('lld'/'hld'), so the frontend
// can link back to the right module without a second round trip.
export const resolveTargets = async (records, moduleSlugById) => {
  const topicIds = records.filter((r) => r.targetType === 'topic').map((r) => r.targetId);
  const questionIds = records.filter((r) => r.targetType === 'question').map((r) => r.targetId);

  const [topics, questions] = await Promise.all([
    topicIds.length ? Topic.find({ _id: { $in: topicIds } }).select('name moduleId') : [],
    questionIds.length ? Question.find({ _id: { $in: questionIds } }).select('title moduleId') : [],
  ]);
  const topicMap = new Map(topics.map((t) => [t._id.toString(), t]));
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  return records
    .map((r) => {
      const target =
        r.targetType === 'topic' ? topicMap.get(r.targetId.toString()) : questionMap.get(r.targetId.toString());
      if (!target) return null; // target was deleted since — skip rather than show a broken entry
      return {
        targetType: r.targetType,
        targetId: r.targetId,
        name: r.targetType === 'topic' ? target.name : target.title,
        module: moduleSlugById[target.moduleId?.toString()] || 'lld',
        status: r.status,
        confidence: r.confidence,
        updatedAt: r.updatedAt,
      };
    })
    .filter(Boolean);
};

// The dashboard's "today's preparation" needs only the current day, not a
// full roadmap detail (weeks, all-day statuses) — a lighter, purpose-built
// query rather than reusing roadmapService.getRoadmapDetail's heavier one.
const getRoadmapToday = async (userId) => {
  const roadmap = await Roadmap.findOne({ source: 'system', isActive: true }).sort('createdAt');
  if (!roadmap) return null;

  const studyDays = await RoadmapDay.find({ roadmapId: roadmap._id, dayType: 'study', isActive: true }).sort('dayNumber');
  const progressMap = await progressService.getProgressMap(userId, 'roadmap');
  const completedCount = studyDays.filter((d) => progressMap[d._id.toString()]?.status === 'completed').length;
  const currentDay = studyDays.find((d) => progressMap[d._id.toString()]?.status !== 'completed');

  return {
    roadmapId: roadmap._id,
    roadmapTitle: roadmap.title,
    totalStudyDays: studyDays.length,
    completedStudyDays: completedCount,
    currentDay: currentDay
      ? { _id: currentDay._id, dayNumber: currentDay.dayNumber, focus: currentDay.focus, time: currentDay.time }
      : null,
  };
};

export const getDashboard = async (user) => {
  const userId = new mongoose.Types.ObjectId(user._id);

  const [lld, hld] = await Promise.all([Module.findOne({ slug: 'lld' }), Module.findOne({ slug: 'hld' })]);

  const [topicTotals, questionTotals, topicCompleted, questionCompleted, mockStats, mockTypeStats, roadmapToday] = await Promise.all([
    totalsByModule(Topic),
    totalsByModule(Question),
    completedByModule(userId, 'topic', 'topics'),
    completedByModule(userId, 'question', 'questions'),
    mocksByMode(userId),
    mocksByType(userId),
    getRoadmapToday(userId),
  ]);

  const emptyMockStats = { count: 0, averageScore: null };
  const lldSection = moduleSection(
    lld?._id,
    topicTotals,
    topicCompleted,
    questionTotals,
    questionCompleted,
    mockStats.lld || emptyMockStats
  );
  const hldSection = moduleSection(
    hld?._id,
    topicTotals,
    topicCompleted,
    questionTotals,
    questionCompleted,
    mockStats.hld || emptyMockStats
  );

  const overallCompletedTopics = lldSection.topics.completed + hldSection.topics.completed;
  const overallTotalTopics = lldSection.topics.total + hldSection.topics.total;
  const overallCompletedQuestions = lldSection.questions.completed + hldSection.questions.completed;
  const overallTotalQuestions = lldSection.questions.total + hldSection.questions.total;

  const overall = {
    completedTopics: overallCompletedTopics,
    totalTopics: overallTotalTopics,
    completedQuestions: overallCompletedQuestions,
    totalQuestions: overallTotalQuestions,
    // (completedTopics + completedQuestions) / (totalTopics + totalQuestions) * 100
    percentage: pct(
      overallCompletedTopics + overallCompletedQuestions,
      overallTotalTopics + overallTotalQuestions
    ),
  };

  // Weak areas: lowest-confidence topics/questions this user has actually
  // rated, not a mock-performance signal — there's no mock data to compute
  // that from yet. confidence <= 2 (of 5) is "weak"; unrated items (no
  // confidence set) are excluded rather than treated as weak by default.
  const moduleSlugById = {};
  if (lld) moduleSlugById[lld._id.toString()] = 'lld';
  if (hld) moduleSlugById[hld._id.toString()] = 'hld';

  const weakRecords = await UserProgress.find({
    userId,
    confidence: { $ne: null, $lte: 2 },
  })
    .sort('confidence -updatedAt')
    .limit(5);
  const weakAreas = await resolveTargets(weakRecords, moduleSlugById);

  // Recent activity: any status change away from not_started, most recent
  // first — this is genuinely derived from UserProgress timestamps, not a
  // separate activity-log system.
  const recentRecords = await UserProgress.find({
    userId,
    status: { $in: ['in_progress', 'completed'] },
  })
    .sort('-updatedAt')
    .limit(8);
  const recentActivity = await resolveTargets(recentRecords, moduleSlugById);

  // Recent mock interviews — real, from MockInterview, most recent first.
  const recentMocks = await MockInterview.find({ userId }).sort('-createdAt').limit(5);

  const allScored = [mockStats.lld, mockStats.hld, mockStats.mixed].filter(Boolean);
  const totalScoredCount = allScored.reduce((sum, m) => sum + (m.averageScore !== null ? 1 : 0), 0);
  const overallAverageScore =
    totalScoredCount > 0
      ? Math.round(allScored.reduce((sum, m) => sum + (m.averageScore || 0), 0) / totalScoredCount)
      : null;

  return {
    user: {
      name: user.name,
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalStudyMinutes: user.totalStudyMinutes,
    },
    lld: lldSection,
    hld: hldSection,
    overall,
    mocks: {
      lld: mockStats.lld?.count || 0,
      hld: mockStats.hld?.count || 0,
      mixed: mockStats.mixed?.count || 0,
      byType: { topic: mockTypeStats.topic, question: mockTypeStats.question },
      averageScore: overallAverageScore,
      recent: recentMocks.map((m) => ({
        id: m._id,
        mode: m.mode,
        type: m.type,
        status: m.status,
        totalScore: m.totalScore,
        questionCount: m.type === 'topic' ? m.topicPrompts.length : m.questions.length,
        startedAt: m.startedAt,
      })),
    },
    weakAreas,
    recentActivity,
    roadmapToday,
  };
};
