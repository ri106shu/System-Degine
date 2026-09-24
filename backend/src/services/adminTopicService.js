import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import Module from '../models/Module.js';
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

// GET /api/admin/topics — unlike the user-facing listTopics, this can show
// inactive (soft-deleted) topics too, since an admin needs to find and
// restore them; the user-facing list never shows deleted content at all.
export const getAdminTopicList = async ({ module, search, category, difficulty, status = 'active', page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (module && module !== 'all') {
    const foundModule = await Module.findOne({ slug: module });
    filter.moduleId = foundModule?._id || null;
  }
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;
  if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;
  // status === 'all' — no isActive filter at all
  if (search) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { description: re }, { category: re }];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [topics, total] = await Promise.all([
    Topic.find(filter)
      .sort('category order name')
      .skip(skip)
      .limit(safeLimit)
      .populate('moduleId', 'slug name')
      .populate('createdBy', 'name email'),
    Topic.countDocuments(filter),
  ]);

  return { topics, total, page: safePage, limit: safeLimit, totalPages: Math.max(Math.ceil(total / safeLimit), 1) };
};

export const getAdminTopicById = async (id) => {
  const topic = await Topic.findById(id).populate('moduleId', 'slug name').populate('createdBy', 'name email');
  if (!topic) throw new ApiError(404, 'Topic not found');
  return topic;
};

// Admin-created content is platform/system content — source: 'system',
// createdBy: null — not attributed to the admin's personal account, which
// matters because a topic's createdBy is also what the user-facing
// ownership check (isOwnerOrAdmin) uses to decide who may edit it; system
// content should be editable by any admin, not just whichever one created it.
export const createAdminTopic = async (data, adminUser) => {
  const foundModule = await resolveModule(data.module);

  const topic = await Topic.create({
    name: data.name,
    description: data.description || '',
    category: data.category,
    difficulty: data.difficulty,
    moduleId: foundModule._id,
    slug: data.slug ? slugify(data.slug) : slugify(data.name),
    order: data.order ?? 0,
    createdBy: null,
    source: 'system',
  });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CREATED_TOPIC',
    targetType: 'topic',
    targetId: topic._id,
    description: `Created ${foundModule.slug.toUpperCase()} topic "${topic.name}"`,
    metadata: { module: foundModule.slug, category: topic.category, difficulty: topic.difficulty },
  });

  return topic;
};

export const updateAdminTopic = async (id, data, adminUser) => {
  const topic = await Topic.findById(id);
  if (!topic) throw new ApiError(404, 'Topic not found');

  const changed = {};
  for (const field of ['name', 'description', 'category', 'difficulty', 'order']) {
    if (data[field] !== undefined && data[field] !== topic[field]) {
      changed[field] = { from: topic[field], to: data[field] };
      topic[field] = data[field];
    }
  }
  if (data.slug !== undefined) {
    const newSlug = slugify(data.slug);
    if (newSlug !== topic.slug) {
      changed.slug = { from: topic.slug, to: newSlug };
      topic.slug = newSlug;
    }
  }
  if (data.module !== undefined) {
    const foundModule = await resolveModule(data.module);
    if (foundModule._id.toString() !== topic.moduleId.toString()) {
      changed.module = { from: topic.moduleId.toString(), to: foundModule._id.toString() };
      topic.moduleId = foundModule._id;
    }
  }

  if (Object.keys(changed).length === 0) return topic; // no-op, nothing to log

  await topic.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_TOPIC',
    targetType: 'topic',
    targetId: topic._id,
    description: `Updated topic "${topic.name}"`,
    metadata: { changed },
  });

  return topic;
};

// Soft-delete, cascading to the topic's questions — same rule the
// user-facing deleteTopic already follows, so an admin deleting a topic
// can't leave dangling active questions pointing at an inactive topic.
export const deleteAdminTopic = async (id, adminUser) => {
  const topic = await Topic.findById(id);
  if (!topic) throw new ApiError(404, 'Topic not found');
  if (!topic.isActive) return topic; // already deleted, nothing to log

  topic.isActive = false;
  await topic.save();
  const { modifiedCount } = await Question.updateMany({ topicId: topic._id, isActive: true }, { $set: { isActive: false } });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_TOPIC',
    targetType: 'topic',
    targetId: topic._id,
    description: `Deleted topic "${topic.name}"${modifiedCount > 0 ? ` (${modifiedCount} question${modifiedCount === 1 ? '' : 's'} deactivated with it)` : ''}`,
    metadata: { questionsDeactivated: modifiedCount },
  });

  return topic;
};

export const restoreAdminTopic = async (id, adminUser) => {
  const topic = await Topic.findById(id);
  if (!topic) throw new ApiError(404, 'Topic not found');
  if (topic.isActive) return topic; // already active, nothing to log

  topic.isActive = true;
  await topic.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_RESTORED_TOPIC',
    targetType: 'topic',
    targetId: topic._id,
    description: `Restored topic "${topic.name}"`,
  });

  return topic;
};
