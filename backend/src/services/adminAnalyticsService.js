import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapDay from '../models/RoadmapDay.js';
import MockInterview from '../models/MockInterview.js';
import UserProgress from '../models/UserProgress.js';
import Module from '../models/Module.js';
import User from '../models/User.js';
import { groupByDay } from '../utils/activityStreaks.js';

const RANGE_MS = {
  today: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};
const rangeSince = (range) => (range && range !== 'all' && RANGE_MS[range] ? new Date(Date.now() - RANGE_MS[range]) : null);

const countByModule = async (Model, extraFilter = {}) => {
  const modules = await Module.find({});
  const result = {};
  for (const m of modules) {
    result[m.slug] = await Model.countDocuments({ moduleId: m._id, isActive: true, ...extraFilter });
  }
  return result;
};

// ---- Content overview: never time-scoped — "how much content exists" isn't a period metric.
const getContentOverview = async () => {
  const [topics, questions, prompts, roadmaps] = await Promise.all([
    countByModule(Topic),
    countByModule(Question),
    countByModule(TopicInterviewPrompt),
    countByModule(Roadmap),
  ]);
  return {
    totalTopics: (topics.lld || 0) + (topics.hld || 0),
    lldTopics: topics.lld || 0,
    hldTopics: topics.hld || 0,
    totalQuestions: (questions.lld || 0) + (questions.hld || 0),
    lldQuestions: questions.lld || 0,
    hldQuestions: questions.hld || 0,
    topicPrompts: (prompts.lld || 0) + (prompts.hld || 0),
    lldRoadmaps: roadmaps.lld || 0,
    hldRoadmaps: roadmaps.hld || 0,
  };
};

// ---- Interview activity: time-scoped by startedAt, admin accounts excluded.
const getInterviewActivity = async (since, excludeUserIds) => {
  const filter = { userId: { $nin: excludeUserIds }, ...(since ? { startedAt: { $gte: since } } : {}) };
  const [total, completed, inProgress, abandoned, lld, hld, mixed] = await Promise.all([
    MockInterview.countDocuments(filter),
    MockInterview.countDocuments({ ...filter, status: 'completed' }),
    MockInterview.countDocuments({ ...filter, status: 'in_progress' }),
    MockInterview.countDocuments({ ...filter, status: 'abandoned' }),
    MockInterview.countDocuments({ ...filter, mode: 'lld' }),
    MockInterview.countDocuments({ ...filter, mode: 'hld' }),
    MockInterview.countDocuments({ ...filter, mode: 'mixed' }),
  ]);
  return { total, completed, inProgress, abandoned, lld, hld, mixed };
};

// ---- Daily activity chart: mocks started per day, real dates only, admin accounts excluded.
const getDailyActivity = async (since, excludeUserIds) => {
  const filter = { userId: { $nin: excludeUserIds }, ...(since ? { startedAt: { $gte: since } } : {}) };
  const mocks = await MockInterview.find(filter).select('startedAt status').lean();
  const startedByDay = groupByDay(mocks.map((m) => m.startedAt));
  const completedByDay = groupByDay(mocks.filter((m) => m.status === 'completed').map((m) => m.startedAt));
  const days = [...new Set([...Object.keys(startedByDay), ...Object.keys(completedByDay)])].sort();
  return days.map((day) => ({ day, started: startedByDay[day] || 0, completed: completedByDay[day] || 0 }));
};

// ---- LLD vs HLD module comparison, admin accounts excluded from mock counts.
const getModuleComparison = async (since, excludeUserIds) => {
  const modules = await Module.find({});
  const result = {};
  for (const m of modules) {
    const mockFilter = { mode: m.slug, userId: { $nin: excludeUserIds }, ...(since ? { startedAt: { $gte: since } } : {}) };
    const [topics, questions, mocksTotal, mocksCompleted] = await Promise.all([
      Topic.countDocuments({ moduleId: m._id, isActive: true }),
      Question.countDocuments({ moduleId: m._id, isActive: true }),
      MockInterview.countDocuments(mockFilter),
      MockInterview.countDocuments({ ...mockFilter, status: 'completed' }),
    ]);
    result[m.slug] = { topics, questions, mocks: mocksTotal, completed: mocksCompleted };
  }
  return result;
};

// ---- Question activity: attempted = any UserProgress record at all;
// completed = status:'completed' specifically. Admin accounts excluded.
// Aggregated in Mongo, not loaded wholesale into the app.
const getQuestionActivity = async (since, excludeUserIds, limit = 5) => {
  const match = { targetType: 'question', userId: { $nin: excludeUserIds } };
  if (since) match.updatedAt = { $gte: since };

  const [attemptedAgg, completedAgg] = await Promise.all([
    UserProgress.aggregate([{ $match: match }, { $group: { _id: '$targetId', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: limit }]),
    UserProgress.aggregate([
      { $match: { ...match, status: 'completed' } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]),
  ]);

  const ids = [...new Set([...attemptedAgg.map((a) => a._id), ...completedAgg.map((a) => a._id)])];
  const questions = await Question.find({ _id: { $in: ids } })
    .populate('moduleId', 'slug')
    .populate('topicId', 'name');
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));

  const toEntry = (row) => {
    const q = byId.get(row._id.toString());
    if (!q) return null;
    return { id: q._id, title: q.title, module: q.moduleId?.slug, topic: q.topicId?.name, difficulty: q.difficulty, count: row.count };
  };

  return {
    mostAttempted: attemptedAgg.map(toEntry).filter(Boolean),
    mostCompleted: completedAgg.map(toEntry).filter(Boolean),
  };
};

const getMostActiveTopics = async (since, excludeUserIds, limit = 5) => {
  const match = { targetType: 'topic', userId: { $nin: excludeUserIds } };
  if (since) match.updatedAt = { $gte: since };

  const agg = await UserProgress.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$targetId',
        activities: { $sum: 1 },
        completions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { activities: -1 } },
    { $limit: limit },
  ]);
  const topics = await Topic.find({ _id: { $in: agg.map((a) => a._id) } }).populate('moduleId', 'slug');
  const byId = new Map(topics.map((t) => [t._id.toString(), t]));

  return agg
    .map((row) => {
      const t = byId.get(row._id.toString());
      if (!t) return null;
      return { id: t._id, name: t.name, module: t.moduleId?.slug, activities: row.activities, completions: row.completions };
    })
    .filter(Boolean);
};

// ---- Difficulty distribution: over completed UserProgress across topics +
// questions, admin accounts excluded.
const getDifficultyDistribution = async (since, excludeUserIds) => {
  const match = { status: 'completed', targetType: { $in: ['topic', 'question'] }, userId: { $nin: excludeUserIds } };
  if (since) match.updatedAt = { $gte: since };
  const records = await UserProgress.find(match).select('targetType targetId').lean();

  const topicIds = records.filter((r) => r.targetType === 'topic').map((r) => r.targetId);
  const questionIds = records.filter((r) => r.targetType === 'question').map((r) => r.targetId);
  const [topics, questions] = await Promise.all([
    Topic.find({ _id: { $in: topicIds } }).select('difficulty').lean(),
    Question.find({ _id: { $in: questionIds } }).select('difficulty').lean(),
  ]);

  const counts = { Easy: 0, Medium: 0, Hard: 0 };
  for (const t of [...topics, ...questions]) {
    if (t.difficulty in counts) counts[t.difficulty] += 1;
  }
  const total = counts.Easy + counts.Medium + counts.Hard;
  if (total === 0) return { Easy: 0, Medium: 0, Hard: 0, total: 0 };
  return {
    Easy: Math.round((counts.Easy / total) * 100),
    Medium: Math.round((counts.Medium / total) * 100),
    Hard: Math.round((counts.Hard / total) * 100),
    total,
  };
};

// ---- Roadmap activity: only metrics this schema actually tracks — no
// "views" or "starts" concept exists anywhere, so none is invented here.
// What's real: how many study days exist per module, and how many
// roadmap-day completions have actually happened (UserProgress targetType
// 'roadmap'), admin accounts excluded from the completion count.
const getRoadmapActivity = async (since, excludeUserIds) => {
  const modules = await Module.find({});
  const result = {};
  for (const m of modules) {
    const roadmaps = await Roadmap.find({ moduleId: m._id, isActive: true }).select('_id');
    const roadmapIds = roadmaps.map((r) => r._id);
    const [studyDays, restDays] = await Promise.all([
      RoadmapDay.countDocuments({ roadmapId: { $in: roadmapIds }, dayType: 'study', isActive: true }),
      RoadmapDay.countDocuments({ roadmapId: { $in: roadmapIds }, dayType: 'rest', isActive: true }),
    ]);
    const dayIds = await RoadmapDay.find({ roadmapId: { $in: roadmapIds } }).select('_id');
    const completionMatch = {
      targetType: 'roadmap',
      status: 'completed',
      targetId: { $in: dayIds.map((d) => d._id) },
      userId: { $nin: excludeUserIds },
    };
    if (since) completionMatch.updatedAt = { $gte: since };
    const completedDayInstances = await UserProgress.countDocuments(completionMatch);
    result[m.slug] = { studyDays, restDays, completedDayInstances };
  }
  return result;
};

// ---- Recent platform activity: last N real completions, admin accounts excluded.
const getRecentActivity = async (excludeUserIds, limit = 10) => {
  const [progressRows, mockRows] = await Promise.all([
    UserProgress.find({ status: 'completed', userId: { $nin: excludeUserIds } })
      .sort('-updatedAt')
      .limit(limit)
      .populate('userId', 'name')
      .lean(),
    MockInterview.find({ status: { $in: ['completed', 'in_progress'] }, userId: { $nin: excludeUserIds } })
      .sort('-startedAt')
      .limit(limit)
      .populate('userId', 'name')
      .select('userId mode status startedAt completedAt')
      .lean(),
  ]);

  const progressEntries = progressRows.map((r) => ({
    type: `${r.targetType}_completed`,
    userName: r.userId?.name || 'A user',
    timestamp: r.updatedAt,
  }));
  const mockEntries = mockRows.map((m) => ({
    type: m.status === 'completed' ? 'mock_completed' : 'mock_started',
    userName: m.userId?.name || 'A user',
    module: m.mode,
    timestamp: m.status === 'completed' ? m.completedAt : m.startedAt,
  }));

  return [...progressEntries, ...mockEntries]
    .filter((e) => e.timestamp)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

export const getAdminAnalytics = async (range = '30d') => {
  const since = rangeSince(range);
  const adminUsers = await User.find({ role: 'admin' }).select('_id');
  const excludeUserIds = adminUsers.map((u) => u._id);

  const [
    overview,
    interviewActivity,
    dailyActivity,
    moduleComparison,
    questionActivity,
    mostActiveTopics,
    difficultyDistribution,
    roadmapActivity,
    recentActivity,
  ] = await Promise.all([
    getContentOverview(),
    getInterviewActivity(since, excludeUserIds),
    getDailyActivity(since, excludeUserIds),
    getModuleComparison(since, excludeUserIds),
    getQuestionActivity(since, excludeUserIds),
    getMostActiveTopics(since, excludeUserIds),
    getDifficultyDistribution(since, excludeUserIds),
    getRoadmapActivity(since, excludeUserIds),
    getRecentActivity(excludeUserIds),
  ]);

  return {
    range,
    overview,
    interviewActivity,
    dailyActivity,
    moduleComparison,
    mostAttemptedQuestions: questionActivity.mostAttempted,
    mostCompletedQuestions: questionActivity.mostCompleted,
    mostActiveTopics,
    difficultyDistribution,
    roadmapActivity,
    recentActivity,
  };
};
