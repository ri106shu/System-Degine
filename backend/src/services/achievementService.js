import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import UserProgress from '../models/UserProgress.js';
import MockInterview from '../models/MockInterview.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapDay from '../models/RoadmapDay.js';
import UserAchievement from '../models/UserAchievement.js';
import { ACHIEVEMENTS } from '../config/achievements.js';
import { computeStreaks } from '../utils/activityStreaks.js';

// Every metric an achievement can reference. Computed once per call from
// real data — never from User.xp/currentStreak, which nothing in the
// codebase actually writes to (see the README).
const computeMetrics = async (userId) => {
  const [lld, hld] = await Promise.all([Module.findOne({ slug: 'lld' }), Module.findOne({ slug: 'hld' })]);

  const completedTopicProgress = await UserProgress.find({ userId, targetType: 'topic', status: 'completed' }).select('targetId completedAt');
  const completedTopicIds = completedTopicProgress.map((p) => p.targetId);
  const completedTopicDocs = await Topic.find({ _id: { $in: completedTopicIds }, isActive: true }).select('moduleId');
  const completedLldTopics = completedTopicDocs.filter((t) => lld && t.moduleId.toString() === lld._id.toString()).length;
  const completedHldTopics = completedTopicDocs.filter((t) => hld && t.moduleId.toString() === hld._id.toString()).length;

  const completedQuestions = await UserProgress.countDocuments({ userId, targetType: 'question', status: 'completed' });
  const completedMocks = await MockInterview.countDocuments({ userId, status: 'completed' });

  // Roadmap days: only study days count (rest days never count toward any
  // completion metric, achievements included).
  const roadmaps = await Roadmap.find({ isActive: true });
  const studyDaysByRoadmap = new Map();
  for (const r of roadmaps) {
    const days = await RoadmapDay.find({ roadmapId: r._id, isActive: true, dayType: 'study' }).select('_id');
    studyDaysByRoadmap.set(r._id.toString(), days.map((d) => d._id.toString()));
  }
  const allStudyDayIds = [...studyDaysByRoadmap.values()].flat();
  const completedRoadmapProgress = await UserProgress.find({
    userId,
    targetType: 'roadmap',
    status: 'completed',
    targetId: { $in: allStudyDayIds },
  }).select('targetId completedAt');
  const completedRoadmapDayIdSet = new Set(completedRoadmapProgress.map((p) => p.targetId.toString()));
  const completedRoadmapDays = completedRoadmapDayIdSet.size;

  // "Complete an entire roadmap" is a boolean, not a count — 1 if ANY
  // roadmap has every one of its study days completed by this user, 0
  // otherwise. Kept in the same {progress, target} shape as every other
  // achievement so the evaluation logic doesn't need a special case.
  const roadmapFullyCompleted = [...studyDaysByRoadmap.values()].some(
    (dayIds) => dayIds.length > 0 && dayIds.every((id) => completedRoadmapDayIdSet.has(id))
  )
    ? 1
    : 0;

  // Streak: the same real computation Analytics uses, not a separate one —
  // one source of truth for "what counts as an active day."
  const completedMockDates = await MockInterview.find({ userId, status: 'completed' }).select('completedAt');
  const allCompletionDates = [
    ...completedTopicProgress.map((p) => p.completedAt).filter(Boolean),
    ...completedMockDates.map((m) => m.completedAt).filter(Boolean),
  ];
  const { longestStreak } = computeStreaks(allCompletionDates);

  return {
    completedTopics: completedTopicDocs.length,
    completedQuestions,
    completedMocks,
    completedRoadmapDays,
    roadmapFullyCompleted,
    longestStreak,
    completedLldTopics,
    completedHldTopics,
  };
};

// Evaluates the whole catalog against real metrics, persists any
// achievement that has just become eligible and wasn't already earned, and
// returns the full list (progress + earned state) plus which ones were
// newly unlocked by THIS call specifically — so a caller right after a
// completion action can toast exactly those, not every already-earned one.
export const evaluateAchievements = async (userId) => {
  const metrics = await computeMetrics(userId);
  const existing = await UserAchievement.find({ userId });
  const earnedMap = new Map(existing.map((e) => [e.achievementKey, e.earnedAt]));

  const newlyUnlocked = [];
  const results = [];

  for (const def of ACHIEVEMENTS) {
    const progress = Math.min(metrics[def.metric] ?? 0, def.target);
    const alreadyEarned = earnedMap.has(def.key);
    const nowQualifies = (metrics[def.metric] ?? 0) >= def.target;

    let earnedAt = alreadyEarned ? earnedMap.get(def.key) : null;

    if (!alreadyEarned && nowQualifies) {
      // The unique index on {userId, achievementKey} is the real guarantee
      // against double-awarding — this try/catch handles the harmless race
      // where two requests both see "not yet earned" and both try to
      // insert; the loser's duplicate-key error is expected, not a bug.
      try {
        const record = await UserAchievement.create({ userId, achievementKey: def.key });
        earnedAt = record.earnedAt;
        newlyUnlocked.push({ key: def.key, name: def.name, description: def.description, icon: def.icon });
      } catch (err) {
        if (err.code === 11000) {
          const existingRecord = await UserAchievement.findOne({ userId, achievementKey: def.key });
          earnedAt = existingRecord?.earnedAt || new Date();
        } else {
          throw err;
        }
      }
    }

    results.push({
      key: def.key,
      name: def.name,
      description: def.description,
      category: def.category,
      icon: def.icon,
      target: def.target,
      progress,
      earned: earnedAt != null,
      earnedAt,
    });
  }

  return { achievements: results, newlyUnlocked };
};

export const getAchievementStats = async (userId) => {
  const { achievements } = await evaluateAchievements(userId);
  const earned = achievements.filter((a) => a.earned);
  const recentAchievements = earned
    .slice()
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, 5);
  return {
    earnedCount: earned.length,
    totalCount: achievements.length,
    completionPercentage: achievements.length > 0 ? Math.round((earned.length / achievements.length) * 100) : 0,
    recentAchievements,
  };
};

export const __private = { computeMetrics };
