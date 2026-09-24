import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import Module from '../models/Module.js';
import ApiError from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

const isOwnerOrAdmin = (topic, user) =>
  user.role === 'admin' || (topic.createdBy && topic.createdBy.toString() === user._id.toString());

export const listTopics = async ({ moduleSlug, category }) => {
  const filter = { isActive: true };

  if (moduleSlug) {
    const foundModule = await Module.findOne({ slug: moduleSlug });
    if (!foundModule) return [];
    filter.moduleId = foundModule._id;
  }
  if (category) filter.category = category;

  return Topic.find(filter).sort('category order').populate('moduleId', 'slug name').populate('createdBy', 'name');
};

export const getTopic = async (id) => {
  const topic = await Topic.findOne({ _id: id, isActive: true })
    .populate('moduleId', 'slug name')
    .populate('createdBy', 'name');
  if (!topic) throw new ApiError(404, 'Topic not found');
  return topic;
};

export const createTopic = async (data, user) => {
  const foundModule = await Module.findOne({ slug: data.module });
  if (!foundModule) {
    throw new ApiError(400, 'Unknown module', [{ field: 'module', message: `No module with slug "${data.module}"` }]);
  }

  return Topic.create({
    name: data.name,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    moduleId: foundModule._id,
    // Suffixed with part of the creator's own id: the unique index is
    // (moduleId, slug, source), not (..., createdBy) — without this, two
    // different users each naming a topic "System Design Basics" would
    // collide. System content skips the suffix since seedTopics.js
    // guarantees those names are unique on their own.
    slug: `${slugify(data.name)}-${user._id.toString().slice(-6)}`,
    createdBy: user._id,
    source: 'user',
  });
};

export const updateTopic = async (id, data, user) => {
  const topic = await Topic.findOne({ _id: id, isActive: true });
  if (!topic) throw new ApiError(404, 'Topic not found');
  if (!isOwnerOrAdmin(topic, user)) {
    throw new ApiError(403, 'You can only edit topics you created');
  }

  ['name', 'description', 'category', 'difficulty'].forEach((field) => {
    if (data[field] !== undefined) topic[field] = data[field];
  });
  await topic.save();
  return topic;
};

// Soft-delete (section 24, Option B): never hard-removes a topic, so
// existing questions and past mock-history references never dangle.
// Cascades to soft-delete dependent questions too, so nothing orphaned
// stays visible in an active listing — "never leave broken topic
// references" holds without the caller having to reassign anything first.
export const deleteTopic = async (id, user) => {
  const topic = await Topic.findOne({ _id: id, isActive: true });
  if (!topic) throw new ApiError(404, 'Topic not found');
  if (!isOwnerOrAdmin(topic, user)) {
    throw new ApiError(403, 'You can only delete topics you created');
  }

  topic.isActive = false;
  await topic.save();

  const { modifiedCount } = await Question.updateMany(
    { topicId: topic._id, isActive: true },
    { $set: { isActive: false } }
  );

  return { topic, questionsDeactivated: modifiedCount };
};
