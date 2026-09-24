import UserProgress from '../models/UserProgress.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import RoadmapDay from '../models/RoadmapDay.js';
import ApiError from '../utils/ApiError.js';

const TARGET_MODELS = { topic: Topic, question: Question, roadmap: RoadmapDay };

// Returns { [targetId]: { status, confidence, completedAt, timeSpent, notes } }
// — the shape the frontend actually wants: an O(1) lookup while rendering a
// list of topics/questions, not an array it has to index itself.
export const getProgressMap = async (userId, targetType) => {
  const records = await UserProgress.find({ userId, targetType });
  const map = {};
  for (const r of records) {
    map[r.targetId.toString()] = {
      status: r.status,
      confidence: r.confidence,
      completedAt: r.completedAt,
      timeSpent: r.timeSpent,
      notes: r.notes,
    };
  }
  return map;
};

export const upsertProgress = async ({ userId, targetType, targetId, status, confidence, timeSpent, notes }) => {
  const TargetModel = TARGET_MODELS[targetType];
  const target = await TargetModel.findOne({ _id: targetId, isActive: true });
  if (!target) {
    const label = targetType === 'roadmap' ? 'Roadmap day' : `${targetType[0].toUpperCase()}${targetType.slice(1)}`;
    throw new ApiError(404, `${label} not found`);
  }

  const update = { status };
  if (confidence !== undefined) update.confidence = confidence;
  if (timeSpent !== undefined) update.timeSpent = timeSpent;
  if (notes !== undefined) update.notes = notes;
  update.completedAt = status === 'completed' ? new Date() : null;

  const progress = await UserProgress.findOneAndUpdate(
    { userId, targetType, targetId },
    { $set: update, $setOnInsert: { userId, targetType, targetId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // XP-on-first-completion hooks in here once gamification event handling
  // is wired up (section 37) — deliberately not implemented yet; awarding
  // correctly requires knowing the *previous* status to avoid re-awarding
  // on completed -> completed, which belongs with the rest of that work,
  // not here.

  return progress;
};
