import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import UserProgress from '../models/UserProgress.js';
import MockInterview from '../models/MockInterview.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapWeek from '../models/RoadmapWeek.js';
import RoadmapDay from '../models/RoadmapDay.js';
import * as dashboardService from './dashboardService.js';
import { computeStreaks, groupByDay } from '../utils/activityStreaks.js';

const { pct, totalsByModule, completedByModule, mocksByMode, mocksByType } = dashboardService;

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: null };

const rangeCutoff = (range) => {
  const days = RANGE_DAYS[range] ?? null;
  if (days == null) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// ----- Topic/question status + difficulty breakdown, by module -----

const statusAndDifficultyBreakdown = async (userId, Model, targetType, moduleIds) => {
  const items = await Model.find({ moduleId: { $in: moduleIds }, isActive: true }).select('difficulty moduleId');
  const progressRows = await UserProgress.find({ userId, targetType }).select('targetId status confidence');
  const progressByTarget = new Map(progressRows.map((p) => [p.targetId.toString(), p]));

  const status = { completed: 0, in_progress: 0, not_started: 0 };
  const byDifficulty = { Easy: { completed: 0, total: 0 }, Medium: { completed: 0, total: 0 }, Hard: { completed: 0, total: 0 } };

  for (const item of items) {
    const progress = progressByTarget.get(item._id.toString());
    const itemStatus = progress?.status || 'not_started';
    status[itemStatus] = (status[itemStatus] || 0) + 1;

    const diff = DIFFICULTIES.includes(item.difficulty) ? item.difficulty : null;
    if (diff) {
      byDifficulty[diff].total += 1;
      if (itemStatus === 'completed') byDifficulty[diff].completed += 1;
    }
  }

  return { status, total: items.length, byDifficulty };
};

export const getAnalytics = async (userId, { module = 'all', range = 'all' } = {}) => {
  const modules = await Module.find({});
  const lld = modules.find((m) => m.slug === 'lld');
  const hld = modules.find((m) => m.slug === 'hld');
  const moduleIds =
    module === 'lld' ? [lld?._id].filter(Boolean) : module === 'hld' ? [hld?._id].filter(Boolean) : [lld?._id, hld?._id].filter(Boolean);

  const cutoff = rangeCutoff(range);

  const [topicTotals, questionTotals, topicCompleted, questionCompleted, mockStatsByMode, mockTypeStats] = await Promise.all([
    totalsByModule(Topic),
    totalsByModule(Question),
    completedByModule(userId, 'topic', 'topics'),
    completedByModule(userId, 'question', 'questions'),
    mocksByMode(userId),
    mocksByType(userId),
  ]);

  // ----- Overview -----
  const totalTopics = moduleIds.reduce((s, id) => s + (topicTotals[id.toString()] || 0), 0);
  const completedTopics = moduleIds.reduce((s, id) => s + (topicCompleted[id.toString()] || 0), 0);
  const totalQuestions = moduleIds.reduce((s, id) => s + (questionTotals[id.toString()] || 0), 0);
  const completedQuestions = moduleIds.reduce((s, id) => s + (questionCompleted[id.toString()] || 0), 0);
  const mockCountAll = (mockStatsByMode.lld?.count || 0) + (mockStatsByMode.hld?.count || 0) + (mockStatsByMode.mixed?.count || 0);

  const overview = {
    topics: { total: totalTopics, completed: completedTopics, percentage: pct(completedTopics, totalTopics) },
    questions: { total: totalQuestions, completed: completedQuestions, percentage: pct(completedQuestions, totalQuestions) },
    overallPreparation: pct(completedTopics + completedQuestions, totalTopics + totalQuestions),
    mocks: { total: mockCountAll },
  };

  // ----- Module comparison (always both, regardless of the module filter — this section's whole point is comparing them) -----
  const moduleSideStats = (mod) => {
    if (!mod) return null;
    const key = mod._id.toString();
    const t = topicTotals[key] || 0;
    const tc = topicCompleted[key] || 0;
    const q = questionTotals[key] || 0;
    const qc = questionCompleted[key] || 0;
    return { topics: t, completedTopics: tc, questions: q, completedQuestions: qc, percentage: pct(tc + qc, t + q) };
  };
  const moduleComparison = { lld: moduleSideStats(lld), hld: moduleSideStats(hld) };

  // ----- Topic/question status + difficulty breakdown -----
  const [topicProgress, questionProgress] = await Promise.all([
    statusAndDifficultyBreakdown(userId, Topic, 'topic', moduleIds),
    statusAndDifficultyBreakdown(userId, Question, 'question', moduleIds),
  ]);
  const difficultyProgress = { topics: topicProgress.byDifficulty, questions: questionProgress.byDifficulty };

  // ----- Mock stats -----
  const mockFilter = { userId };
  if (module !== 'all') mockFilter.mode = module;
  if (cutoff) mockFilter.createdAt = { $gte: cutoff };
  const mockStatusRows = await MockInterview.aggregate([{ $match: mockFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const mockStatusMap = { in_progress: 0, completed: 0, abandoned: 0 };
  for (const row of mockStatusRows) if (row._id in mockStatusMap) mockStatusMap[row._id] = row.count;
  const mockDifficultyRows = await MockInterview.aggregate([{ $match: mockFilter }, { $group: { _id: '$difficulty', count: { $sum: 1 } } }]);
  const mockStats = {
    total: Object.values(mockStatusMap).reduce((a, b) => a + b, 0),
    byStatus: mockStatusMap,
    byMode: mockStatsByMode,
    byType: mockTypeStats,
    byDifficulty: Object.fromEntries(mockDifficultyRows.map((r) => [r._id, r.count])),
    scoringAvailable: false, // no real evaluation mechanism exists yet — see the README
  };

  // ----- Mock activity (time series) -----
  const activityMockFilter = { userId, status: 'completed' };
  if (cutoff) activityMockFilter.completedAt = { $gte: cutoff };
  const completedMocksForActivity = await MockInterview.find(activityMockFilter).select('completedAt');
  const mockActivity = groupByDay(completedMocksForActivity.map((m) => m.completedAt));

  // ----- Preparation activity (topics/questions/roadmap days completed per day) -----
  const prepFilter = { userId, status: 'completed', completedAt: { $ne: null } };
  if (cutoff) prepFilter.completedAt = { $ne: null, $gte: cutoff };
  const completedProgressForActivity = await UserProgress.find(prepFilter).select('completedAt');
  const preparationActivity = groupByDay(completedProgressForActivity.map((p) => p.completedAt));

  // ----- Study time -----
  const allProgressForTime = await UserProgress.find({ userId }).select('targetType timeSpent');
  const topicMinutes = allProgressForTime.filter((p) => p.targetType === 'topic').reduce((s, p) => s + (p.timeSpent || 0), 0);
  const questionMinutes = allProgressForTime.filter((p) => p.targetType === 'question').reduce((s, p) => s + (p.timeSpent || 0), 0);
  const allMocksForTime = await MockInterview.find({ userId }).select('totalTimeSpentSeconds');
  const mockMinutes = Math.round(allMocksForTime.reduce((s, m) => s + (m.totalTimeSpentSeconds || 0), 0) / 60);
  const studyTime = { totalMinutes: topicMinutes + questionMinutes + mockMinutes, topicMinutes, questionMinutes, mockMinutes };

  // ----- Roadmap progress -----
  const roadmapFilter = { isActive: true };
  if (module !== 'all') roadmapFilter.moduleId = moduleIds[0];
  const roadmap = await Roadmap.findOne(roadmapFilter);
  let roadmapProgress = null;
  if (roadmap) {
    const weeks = await RoadmapWeek.find({ roadmapId: roadmap._id, isActive: true }).sort('order');
    const days = await RoadmapDay.find({ roadmapId: roadmap._id, isActive: true }).sort('order');
    const studyDays = days.filter((d) => d.dayType === 'study');
    const dayProgress = await UserProgress.find({ userId, targetType: 'roadmap', targetId: { $in: studyDays.map((d) => d._id) } });
    const completedDayIds = new Set(dayProgress.filter((p) => p.status === 'completed').map((p) => p.targetId.toString()));

    const weekly = weeks.map((w) => {
      const weekStudyDays = studyDays.filter((d) => d.weekId.toString() === w._id.toString());
      const weekCompleted = weekStudyDays.filter((d) => completedDayIds.has(d._id.toString())).length;
      return {
        weekNumber: w.weekNumber,
        title: w.title,
        completed: weekCompleted,
        total: weekStudyDays.length,
        percentage: pct(weekCompleted, weekStudyDays.length),
      };
    });

    const nextUp = studyDays.filter((d) => !completedDayIds.has(d._id.toString())).sort((a, b) => a.dayNumber - b.dayNumber)[0];

    roadmapProgress = {
      title: roadmap.title,
      completedStudyDays: completedDayIds.size,
      totalStudyDays: studyDays.length,
      percentage: pct(completedDayIds.size, studyDays.length),
      currentDay: nextUp ? { dayNumber: nextUp.dayNumber, title: nextUp.title, focus: nextUp.focus } : null,
      weekly,
    };
  }

  // ----- Weak / strong areas -----
  const moduleSlugById = {};
  if (lld) moduleSlugById[lld._id.toString()] = 'lld';
  if (hld) moduleSlugById[hld._id.toString()] = 'hld';

  const weakRows = await UserProgress.find({ userId, confidence: { $ne: null, $lte: 2 }, targetType: { $in: ['topic', 'question'] } })
    .sort('confidence -updatedAt')
    .limit(5);
  const strongRows = await UserProgress.find({ userId, confidence: { $ne: null, $gte: 4 }, targetType: { $in: ['topic', 'question'] } })
    .sort('-confidence -updatedAt')
    .limit(5);
  const [weakAreas, strongAreas] = await Promise.all([
    dashboardService.resolveTargets(weakRows, moduleSlugById),
    dashboardService.resolveTargets(strongRows, moduleSlugById),
  ]);

  // ----- Recent activity -----
  const recentRows = await UserProgress.find({ userId, status: { $in: ['in_progress', 'completed'] } })
    .sort('-updatedAt')
    .limit(10);
  const recentActivity = await dashboardService.resolveTargets(recentRows, moduleSlugById);

  // ----- Streak (real, computed — never the unused User.currentStreak/longestStreak) -----
  const completedProgressDates = await UserProgress.find({ userId, status: 'completed', completedAt: { $ne: null } }).select('completedAt');
  const completedMockDates = await MockInterview.find({ userId, status: 'completed' }).select('completedAt');
  const allCompletionDates = [...completedProgressDates.map((p) => p.completedAt), ...completedMockDates.map((m) => m.completedAt)];
  const streak = computeStreaks(allCompletionDates);

  return {
    filters: { module, range },
    overview: { ...overview, streak },
    moduleComparison,
    topicProgress,
    questionProgress,
    difficultyProgress,
    mockStats,
    mockActivity,
    preparationActivity,
    studyTime,
    roadmapProgress,
    weakAreas,
    strongAreas,
    recentActivity,
  };
};
