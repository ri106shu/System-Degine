import Roadmap from '../models/Roadmap.js';
import RoadmapWeek from '../models/RoadmapWeek.js';
import RoadmapDay from '../models/RoadmapDay.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';
import { logAdminAction } from '../utils/auditLog.js';

const resolveModule = async (moduleSlug) => {
  const foundModule = await Module.findOne({ slug: moduleSlug });
  if (!foundModule) {
    throw new ApiError(400, 'Unknown module', [{ field: 'module', message: `No module with slug "${moduleSlug}"` }]);
  }
  return foundModule;
};

// A temporary offset guaranteed higher than any real weekNumber/dayNumber
// this app will ever have, used to shuffle a value out of the way before
// giving it its final value — the standard safe way to swap two fields that
// both carry a unique index, since writing the final values directly, one
// document at a time, would collide with whichever document currently
// holds the target number.
const SAFE_OFFSET = 1_000_000;

const buildStats = (weeks) => {
  let totalDays = 0;
  let studyDays = 0;
  let restDays = 0;
  for (const w of weeks) {
    for (const d of w.days) {
      totalDays += 1;
      if (d.dayType === 'rest') restDays += 1;
      else studyDays += 1;
    }
  }
  return { totalWeeks: weeks.length, totalDays, studyDays, restDays };
};

const assembleDetail = async (roadmap) => {
  const [weeks, days] = await Promise.all([
    RoadmapWeek.find({ roadmapId: roadmap._id, isActive: true }).sort('order'),
    RoadmapDay.find({ roadmapId: roadmap._id, isActive: true })
      .sort('order')
      .populate('topicIds', 'name')
      .populate('questionIds', 'title'),
  ]);
  const daysByWeek = new Map();
  for (const d of days) {
    const key = d.weekId.toString();
    if (!daysByWeek.has(key)) daysByWeek.set(key, []);
    daysByWeek.get(key).push(d);
  }
  const weeksWithDays = weeks.map((w) => ({ ...w.toObject(), days: daysByWeek.get(w._id.toString()) || [] }));
  return { roadmap, weeks: weeksWithDays, stats: buildStats(weeksWithDays) };
};

// GET /api/admin/roadmaps?module=lld|hld — this admin view treats a module
// as having at most one roadmap (the primary one users actually see), so
// it returns the first active one found rather than a list; the underlying
// Roadmap model doesn't enforce that uniqueness, it's just what this UI
// presents. Returns { roadmap: null, ... } rather than a 404 when none
// exists yet — that's a real, expected state (a fresh HLD module), not an
// error.
export const getAdminRoadmapByModule = async (moduleSlug) => {
  const foundModule = await resolveModule(moduleSlug);
  const roadmap = await Roadmap.findOne({ moduleId: foundModule._id, isActive: true }).sort('-createdAt');
  if (!roadmap) return { roadmap: null, weeks: [], stats: { totalWeeks: 0, totalDays: 0, studyDays: 0, restDays: 0 } };
  return assembleDetail(roadmap);
};

export const getAdminRoadmapDetail = async (roadmapId) => {
  const roadmap = await Roadmap.findById(roadmapId);
  if (!roadmap) throw new ApiError(404, 'Roadmap not found');
  return assembleDetail(roadmap);
};

// The module a roadmap belongs to is fixed by the ROUTE that creates it
// (moduleSlug is passed by the controller from /admin/roadmaps/lld or
// /admin/roadmaps/hld, never read from the request body) — this is what
// actually prevents "accidentally creating an HLD roadmap from the LLD
// screen," not a client-side assumption.
export const createAdminRoadmap = async (moduleSlug, data, adminUser) => {
  const foundModule = await resolveModule(moduleSlug);

  const roadmap = await Roadmap.create({
    title: data.title,
    description: data.description || '',
    moduleId: foundModule._id,
    slug: `${slugify(data.title)}-${Date.now().toString(36)}`,
    totalWeeks: 0,
    totalStudyDays: 0,
    isActive: data.isActive ?? true,
    createdBy: null,
    source: 'system',
  });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CREATED_ROADMAP',
    targetType: 'roadmap',
    targetId: roadmap._id,
    description: `Created ${foundModule.slug.toUpperCase()} roadmap "${roadmap.title}"`,
    metadata: { module: foundModule.slug },
  });

  return assembleDetail(roadmap);
};

// moduleId is never accepted here, at any point — not "ignored if present,"
// genuinely absent from the set of fields this function will ever write.
// That's the enforcement the brief asks for: a roadmap's module can't be
// changed by this endpoint no matter what a request body contains.
export const updateAdminRoadmap = async (id, data, adminUser) => {
  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw new ApiError(404, 'Roadmap not found');

  const changed = {};
  for (const field of ['title', 'description', 'isActive']) {
    if (data[field] !== undefined && data[field] !== roadmap[field]) {
      changed[field] = { from: roadmap[field], to: data[field] };
      roadmap[field] = data[field];
    }
  }

  if (Object.keys(changed).length > 0) {
    await roadmap.save();
    await logAdminAction({
      adminUser,
      action: 'ADMIN_UPDATED_ROADMAP',
      targetType: 'roadmap',
      targetId: roadmap._id,
      description: `Updated roadmap "${roadmap.title}"`,
      metadata: { changed },
    });
  }

  return assembleDetail(roadmap);
};

export const toggleAdminRoadmapActive = async (id, isActive, adminUser) => {
  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw new ApiError(404, 'Roadmap not found');
  if (roadmap.isActive === isActive) return assembleDetail(roadmap);

  roadmap.isActive = isActive;
  await roadmap.save();

  await logAdminAction({
    adminUser,
    action: isActive ? 'ADMIN_ACTIVATED_ROADMAP' : 'ADMIN_DEACTIVATED_ROADMAP',
    targetType: 'roadmap',
    targetId: roadmap._id,
    description: `${isActive ? 'Activated' : 'Deactivated'} roadmap "${roadmap.title}"`,
  });

  return assembleDetail(roadmap);
};

// Deep copy: a new Roadmap, with every week and day cloned under it,
// referencing the new parent ids rather than the originals. The clone gets
// a fresh slug (the unique index is (moduleId, slug, source) — reusing the
// source roadmap's slug would collide with it directly) and keeps the same
// moduleId, since a duplicate is still content for the same module.
export const duplicateAdminRoadmap = async (id, adminUser) => {
  const source = await Roadmap.findById(id);
  if (!source) throw new ApiError(404, 'Roadmap not found');

  const [sourceWeeks, sourceDays] = await Promise.all([
    RoadmapWeek.find({ roadmapId: source._id }).sort('order'),
    RoadmapDay.find({ roadmapId: source._id }).sort('order'),
  ]);

  const clone = await Roadmap.create({
    title: `${source.title} (Copy)`,
    description: source.description,
    moduleId: source.moduleId,
    slug: `${source.slug}-copy-${Date.now().toString(36)}`,
    totalWeeks: source.totalWeeks,
    totalStudyDays: source.totalStudyDays,
    isActive: false, // a duplicate starts inactive so it never silently becomes what users see
    createdBy: null,
    source: 'system',
  });

  const weekIdMap = new Map();
  for (const w of sourceWeeks) {
    const clonedWeek = await RoadmapWeek.create({
      roadmapId: clone._id,
      weekNumber: w.weekNumber,
      title: w.title,
      description: w.description,
      order: w.order,
      isActive: w.isActive,
    });
    weekIdMap.set(w._id.toString(), clonedWeek._id);
  }

  for (const d of sourceDays) {
    const newWeekId = weekIdMap.get(d.weekId.toString());
    if (!newWeekId) continue; // defensive: skip a day whose week wasn't found (shouldn't happen)
    await RoadmapDay.create({
      roadmapId: clone._id,
      weekId: newWeekId,
      dayNumber: d.dayNumber,
      title: d.title,
      focus: d.focus,
      time: d.time,
      dayType: d.dayType,
      order: d.order,
      notes: d.notes,
      topicIds: d.topicIds,
      questionIds: d.questionIds,
      isActive: d.isActive,
      createdBy: null,
      source: 'system',
    });
  }

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DUPLICATED_ROADMAP',
    targetType: 'roadmap',
    targetId: clone._id,
    description: `Duplicated roadmap "${source.title}" as "${clone.title}"`,
    metadata: { sourceRoadmapId: source._id, weeksCloned: sourceWeeks.length, daysCloned: sourceDays.length },
  });

  return assembleDetail(clone);
};

export const deleteAdminRoadmap = async (id, adminUser) => {
  const roadmap = await Roadmap.findById(id);
  if (!roadmap) throw new ApiError(404, 'Roadmap not found');
  if (!roadmap.isActive) return roadmap;

  roadmap.isActive = false;
  await roadmap.save();
  await RoadmapWeek.updateMany({ roadmapId: roadmap._id }, { $set: { isActive: false } });
  await RoadmapDay.updateMany({ roadmapId: roadmap._id }, { $set: { isActive: false } });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_ROADMAP',
    targetType: 'roadmap',
    targetId: roadmap._id,
    description: `Deleted roadmap "${roadmap.title}" (and its weeks and days)`,
  });

  return roadmap;
};

// ---------------------------------------------------------------- Weeks --

export const createAdminWeek = async (roadmapId, data, adminUser) => {
  const roadmap = await Roadmap.findById(roadmapId);
  if (!roadmap) throw new ApiError(404, 'Roadmap not found');

  const lastWeek = await RoadmapWeek.findOne({ roadmapId }).sort('-weekNumber');
  const nextNumber = (lastWeek?.weekNumber || 0) + 1;

  const week = await RoadmapWeek.create({
    roadmapId,
    weekNumber: data.weekNumber ?? nextNumber,
    title: data.title,
    description: data.description || '',
    order: data.order ?? nextNumber,
  });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CREATED_WEEK',
    targetType: 'roadmapWeek',
    targetId: week._id,
    description: `Added Week ${week.weekNumber} ("${week.title}") to "${roadmap.title}"`,
  });

  return week;
};

export const updateAdminWeek = async (weekId, data, adminUser) => {
  const week = await RoadmapWeek.findById(weekId);
  if (!week) throw new ApiError(404, 'Week not found');

  // weekNumber carries a real unique index (roadmapId, weekNumber) — a
  // requested value already held by a different week is rejected outright
  // rather than silently cascading every other week's number, which would
  // be a much bigger, more surprising side effect than the admin asked for.
  // Reordering (swapping two weeks) has its own dedicated move endpoint for
  // exactly this reason.
  if (data.weekNumber !== undefined && data.weekNumber !== week.weekNumber) {
    const collision = await RoadmapWeek.findOne({ roadmapId: week.roadmapId, weekNumber: data.weekNumber, _id: { $ne: week._id } });
    if (collision) {
      throw new ApiError(400, `Week ${data.weekNumber} already exists. Use the reorder buttons to swap week positions instead.`);
    }
  }

  const changed = {};
  for (const field of ['weekNumber', 'title', 'description', 'order']) {
    if (data[field] !== undefined && data[field] !== week[field]) {
      changed[field] = { from: week[field], to: data[field] };
      week[field] = data[field];
    }
  }
  if (Object.keys(changed).length === 0) return week;

  await week.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_WEEK',
    targetType: 'roadmapWeek',
    targetId: week._id,
    description: `Updated Week ${week.weekNumber} ("${week.title}")`,
    metadata: { changed },
  });

  return week;
};

// Deletes the week and every day under it, then closes the numbering gap
// for every week/day that came after — so the roadmap never ends up with
// "Week 1, Week 2, Week 4" after deleting Week 3.
export const deleteAdminWeek = async (weekId, adminUser) => {
  const week = await RoadmapWeek.findById(weekId);
  if (!week) throw new ApiError(404, 'Week not found');

  const daysInWeek = await RoadmapDay.find({ weekId: week._id });
  const dayCount = daysInWeek.length;
  const deletedDayNumbers = daysInWeek.map((d) => d.dayNumber).sort((a, b) => a - b);

  await RoadmapDay.deleteMany({ weekId: week._id });
  await RoadmapWeek.deleteOne({ _id: week._id });

  // Close the gap in weekNumber/order for every later week.
  const laterWeeks = await RoadmapWeek.find({ roadmapId: week.roadmapId, weekNumber: { $gt: week.weekNumber } }).sort('weekNumber');
  for (const w of laterWeeks) {
    w.weekNumber -= 1;
    w.order -= 1;
    await w.save();
  }

  // Close the gap in the roadmap's global dayNumber sequence for every day
  // that came after the deleted week's days. Only meaningful if the
  // deleted week actually had days and there's a real gap to close.
  if (dayCount > 0) {
    const laterDays = await RoadmapDay.find({
      roadmapId: week.roadmapId,
      dayNumber: { $gt: deletedDayNumbers[deletedDayNumbers.length - 1] },
    }).sort('dayNumber');
    for (const d of laterDays) {
      d.dayNumber -= dayCount;
      await d.save();
    }
  }

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_WEEK',
    targetType: 'roadmapWeek',
    targetId: week._id,
    description: `Deleted Week ${week.weekNumber} ("${week.title}") and ${dayCount} day${dayCount === 1 ? '' : 's'} in it`,
    metadata: { daysDeleted: dayCount },
  });

  return { deletedWeekId: week._id, daysDeleted: dayCount };
};

// Swaps this week with its immediate neighbor. Uses a temporary,
// impossibly-high weekNumber for the safety window between the two writes
// so the unique index on (roadmapId, weekNumber) is never violated
// mid-swap — writing the two final values directly, one at a time, would
// collide on whichever week is saved second.
export const moveAdminWeek = async (weekId, direction, adminUser) => {
  const week = await RoadmapWeek.findById(weekId);
  if (!week) throw new ApiError(404, 'Week not found');

  const neighbor = await RoadmapWeek.findOne({
    roadmapId: week.roadmapId,
    weekNumber: direction === 'up' ? { $lt: week.weekNumber } : { $gt: week.weekNumber },
  }).sort(direction === 'up' ? '-weekNumber' : 'weekNumber');

  if (!neighbor) return week; // already at the boundary — a no-op, not an error

  const weekNumberA = week.weekNumber;
  const orderA = week.order;
  const weekNumberB = neighbor.weekNumber;
  const orderB = neighbor.order;

  week.weekNumber = weekNumberA + SAFE_OFFSET;
  await week.save();
  neighbor.weekNumber = weekNumberA;
  neighbor.order = orderA;
  await neighbor.save();
  week.weekNumber = weekNumberB;
  week.order = orderB;
  await week.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_REORDERED_WEEK',
    targetType: 'roadmapWeek',
    targetId: week._id,
    description: `Moved "${week.title}" ${direction} (swapped with "${neighbor.title}")`,
  });

  return week;
};

// ----------------------------------------------------------------- Days --

const resolveModuleScopedIds = async (Model, ids, moduleId, label) => {
  if (!ids || ids.length === 0) return [];
  const found = await Model.find({ _id: { $in: ids }, moduleId });
  if (found.length !== ids.length) {
    throw new ApiError(400, `One or more ${label} ids are invalid or belong to a different module`);
  }
  return found.map((f) => f._id);
};

export const createAdminDay = async (weekId, data, adminUser) => {
  const week = await RoadmapWeek.findById(weekId);
  if (!week) throw new ApiError(404, 'Week not found');
  const roadmap = await Roadmap.findById(week.roadmapId);

  const [lastDayGlobal, lastDayInWeek] = await Promise.all([
    RoadmapDay.findOne({ roadmapId: week.roadmapId }).sort('-dayNumber'),
    RoadmapDay.findOne({ weekId }).sort('-order'),
  ]);
  const nextDayNumber = (lastDayGlobal?.dayNumber || 0) + 1;
  const nextOrder = (lastDayInWeek?.order || 0) + 1;

  const topicIds = await resolveModuleScopedIds(Topic, data.topicIds, roadmap.moduleId, 'topic');
  const questionIds = await resolveModuleScopedIds(Question, data.questionIds, roadmap.moduleId, 'question');

  const day = await RoadmapDay.create({
    roadmapId: week.roadmapId,
    weekId,
    dayNumber: data.dayNumber ?? nextDayNumber,
    title: data.title,
    focus: data.focus || '',
    time: data.time || '',
    dayType: data.dayType || 'study',
    order: data.order ?? nextOrder,
    notes: data.notes || '',
    topicIds,
    questionIds,
    createdBy: null,
    source: 'system',
  });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CREATED_DAY',
    targetType: 'roadmapDay',
    targetId: day._id,
    description: `Added Day ${day.dayNumber} ("${day.title}") to Week ${week.weekNumber}`,
  });

  return day;
};

export const updateAdminDay = async (dayId, data, adminUser) => {
  const day = await RoadmapDay.findById(dayId);
  if (!day) throw new ApiError(404, 'Day not found');
  const roadmap = await Roadmap.findById(day.roadmapId);

  if (data.dayNumber !== undefined && data.dayNumber !== day.dayNumber) {
    const collision = await RoadmapDay.findOne({ roadmapId: day.roadmapId, dayNumber: data.dayNumber, _id: { $ne: day._id } });
    if (collision) {
      throw new ApiError(400, `Day ${data.dayNumber} already exists. Use the reorder buttons to swap day positions instead.`);
    }
  }

  const changed = {};
  for (const field of ['dayNumber', 'title', 'focus', 'time', 'dayType', 'order', 'notes']) {
    if (data[field] !== undefined && data[field] !== day[field]) {
      changed[field] = { from: day[field], to: data[field] };
      day[field] = data[field];
    }
  }
  if (data.topicIds !== undefined) {
    const topicIds = await resolveModuleScopedIds(Topic, data.topicIds, roadmap.moduleId, 'topic');
    if (JSON.stringify(topicIds) !== JSON.stringify(day.topicIds)) {
      changed.topicIds = { from: day.topicIds, to: topicIds };
      day.topicIds = topicIds;
    }
  }
  if (data.questionIds !== undefined) {
    const questionIds = await resolveModuleScopedIds(Question, data.questionIds, roadmap.moduleId, 'question');
    if (JSON.stringify(questionIds) !== JSON.stringify(day.questionIds)) {
      changed.questionIds = { from: day.questionIds, to: questionIds };
      day.questionIds = questionIds;
    }
  }

  if (Object.keys(changed).length === 0) return day;

  await day.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_DAY',
    targetType: 'roadmapDay',
    targetId: day._id,
    description: `Updated Day ${day.dayNumber} ("${day.title}")`,
    metadata: { changed },
  });

  return day;
};

// Closes the gap in both the week-local order and the roadmap's global
// dayNumber sequence for every day after the deleted one.
export const deleteAdminDay = async (dayId, adminUser) => {
  const day = await RoadmapDay.findById(dayId);
  if (!day) throw new ApiError(404, 'Day not found');

  await RoadmapDay.deleteOne({ _id: day._id });

  const laterInWeek = await RoadmapDay.find({ weekId: day.weekId, order: { $gt: day.order } }).sort('order');
  for (const d of laterInWeek) {
    d.order -= 1;
    if (d.roadmapId.toString() === day.roadmapId.toString()) d.dayNumber -= 1;
    await d.save();
  }
  // Days in later weeks also shift down by one in the global sequence,
  // even though their own within-week order is untouched.
  const laterInOtherWeeks = await RoadmapDay.find({
    roadmapId: day.roadmapId,
    weekId: { $ne: day.weekId },
    dayNumber: { $gt: day.dayNumber },
  }).sort('dayNumber');
  for (const d of laterInOtherWeeks) {
    d.dayNumber -= 1;
    await d.save();
  }

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_DAY',
    targetType: 'roadmapDay',
    targetId: day._id,
    description: `Deleted Day ${day.dayNumber} ("${day.title}")`,
  });

  return { deletedDayId: day._id };
};

// Swaps this day with its immediate neighbor WITHIN THE SAME WEEK — cross-week
// reordering isn't offered; moving a day to a different week is an edit
// (change which week it belongs to would need to be a distinct operation
// this task doesn't ask for), not a same-week reorder.
export const moveAdminDay = async (dayId, direction, adminUser) => {
  const day = await RoadmapDay.findById(dayId);
  if (!day) throw new ApiError(404, 'Day not found');

  const neighbor = await RoadmapDay.findOne({
    weekId: day.weekId,
    order: direction === 'up' ? { $lt: day.order } : { $gt: day.order },
  }).sort(direction === 'up' ? '-order' : 'order');

  if (!neighbor) return day;

  const dayNumberA = day.dayNumber;
  const orderA = day.order;
  const dayNumberB = neighbor.dayNumber;
  const orderB = neighbor.order;

  day.dayNumber = dayNumberA + SAFE_OFFSET;
  await day.save();
  neighbor.dayNumber = dayNumberA;
  neighbor.order = orderA;
  await neighbor.save();
  day.dayNumber = dayNumberB;
  day.order = orderB;
  await day.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_REORDERED_DAY',
    targetType: 'roadmapDay',
    targetId: day._id,
    description: `Moved "${day.title}" ${direction} (swapped with "${neighbor.title}")`,
  });

  return day;
};
