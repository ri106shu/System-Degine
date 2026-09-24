import Module from '../models/Module.js';
import Roadmap from '../models/Roadmap.js';
import RoadmapWeek from '../models/RoadmapWeek.js';
import RoadmapDay from '../models/RoadmapDay.js';
import * as progressService from './progressService.js';
import ApiError from '../utils/ApiError.js';

const pct = (completed, total) => (total > 0 ? Math.round((completed / total) * 100) : null);

// System roadmaps for this module, plus this user's own — never another
// user's. System and user roadmaps are both just Roadmap documents
// distinguished by source/createdBy, not separate models.
export const listRoadmaps = async ({ userId, moduleSlug }) => {
  const module = await Module.findOne({ slug: moduleSlug });
  if (!module) return [];

  const roadmaps = await Roadmap.find({
    moduleId: module._id,
    isActive: true,
    $or: [{ source: 'system' }, { createdBy: userId }],
  }).sort('source title');

  // One progress map covers every roadmap in this module — a single query,
  // not one per roadmap.
  const progressMap = await progressService.getProgressMap(userId, 'roadmap');

  const results = [];
  for (const roadmap of roadmaps) {
    const studyDays = await RoadmapDay.find({ roadmapId: roadmap._id, dayType: 'study', isActive: true }).select('_id');
    const completed = studyDays.filter((d) => progressMap[d._id.toString()]?.status === 'completed').length;
    results.push({
      _id: roadmap._id,
      title: roadmap.title,
      description: roadmap.description,
      source: roadmap.source,
      createdBy: roadmap.createdBy,
      totalWeeks: roadmap.totalWeeks,
      totalStudyDays: studyDays.length,
      completedStudyDays: completed,
      percentage: pct(completed, studyDays.length),
    });
  }
  return results;
};

// Full detail: weeks, days, this user's status on every day, and stats
// computed from the real day/progress data — never from the roadmap's own
// stored totalStudyDays, which is descriptive metadata only.
export const getRoadmapDetail = async (roadmapId, userId) => {
  const roadmap = await Roadmap.findOne({ _id: roadmapId, isActive: true });
  if (!roadmap) throw new ApiError(404, 'Roadmap not found');
  if (roadmap.source === 'user' && roadmap.createdBy?.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this roadmap');
  }

  const weeks = await RoadmapWeek.find({ roadmapId, isActive: true }).sort('weekNumber');
  const days = await RoadmapDay.find({ roadmapId, isActive: true }).sort('dayNumber');
  const progressMap = await progressService.getProgressMap(userId, 'roadmap');

  const daysWithStatus = days.map((d) => ({
    _id: d._id,
    dayNumber: d.dayNumber,
    weekId: d.weekId,
    title: d.title,
    focus: d.focus,
    time: d.time,
    dayType: d.dayType,
    order: d.order,
    source: d.source,
    createdBy: d.createdBy,
    status: d.dayType === 'rest' ? null : progressMap[d._id.toString()]?.status || 'not_started',
    confidence: progressMap[d._id.toString()]?.confidence ?? null,
    timeSpent: progressMap[d._id.toString()]?.timeSpent || 0,
    notes: progressMap[d._id.toString()]?.notes || '',
  }));

  const studyDays = daysWithStatus.filter((d) => d.dayType === 'study');
  const completedStudyDays = studyDays.filter((d) => d.status === 'completed');
  const inProgressStudyDays = studyDays.filter((d) => d.status === 'in_progress');

  const weeksWithStats = weeks.map((w) => {
    const weekDays = daysWithStatus.filter((d) => d.weekId.toString() === w._id.toString());
    const weekStudyDays = weekDays.filter((d) => d.dayType === 'study');
    const weekCompleted = weekStudyDays.filter((d) => d.status === 'completed').length;
    return {
      _id: w._id,
      weekNumber: w.weekNumber,
      title: w.title,
      description: w.description,
      order: w.order,
      totalStudyDays: weekStudyDays.length,
      completedStudyDays: weekCompleted,
      percentage: pct(weekCompleted, weekStudyDays.length),
      days: weekDays,
    };
  });

  // "Current day" = the lowest-numbered study day not yet completed — not
  // date-based, and never locks anything; it's a suggestion, not a gate.
  const currentDay = studyDays.find((d) => d.status !== 'completed') || null;
  const currentIndex = currentDay ? studyDays.findIndex((d) => d._id.toString() === currentDay._id.toString()) : -1;
  const nextUp = currentIndex >= 0 ? studyDays.slice(currentIndex + 1, currentIndex + 4).filter((d) => d.status !== 'completed') : [];

  return {
    roadmap: {
      _id: roadmap._id,
      title: roadmap.title,
      description: roadmap.description,
      moduleId: roadmap.moduleId,
      totalWeeks: roadmap.totalWeeks,
      source: roadmap.source,
      createdBy: roadmap.createdBy,
    },
    weeks: weeksWithStats,
    stats: {
      totalStudyDays: studyDays.length,
      totalRestDays: daysWithStatus.length - studyDays.length,
      completed: completedStudyDays.length,
      inProgress: inProgressStudyDays.length,
      remaining: studyDays.length - completedStudyDays.length - inProgressStudyDays.length,
      percentage: pct(completedStudyDays.length, studyDays.length),
    },
    currentDay,
    nextUp,
  };
};
