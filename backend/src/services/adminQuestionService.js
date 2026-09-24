import Question from '../models/Question.js';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import ApiError from '../utils/ApiError.js';
import { logAdminAction } from '../utils/auditLog.js';

const resolveModule = async (moduleSlug) => {
  const foundModule = await Module.findOne({ slug: moduleSlug });
  if (!foundModule) {
    throw new ApiError(400, 'Unknown module', [{ field: 'module', message: `No module with slug "${moduleSlug}"` }]);
  }
  return foundModule;
};

const resolveTopic = async (topicId) => {
  const topic = await Topic.findById(topicId);
  if (!topic) throw new ApiError(400, 'Unknown topic', [{ field: 'topicId', message: 'No topic with that id' }]);
  return topic;
};

export const getAdminQuestionList = async ({
  module,
  search,
  topicId,
  difficulty,
  type,
  status = 'active',
  page = 1,
  limit = 20,
} = {}) => {
  const filter = {};
  if (module && module !== 'all') {
    const foundModule = await Module.findOne({ slug: module });
    filter.moduleId = foundModule?._id || null;
  }
  if (topicId) filter.topicId = topicId;
  if (difficulty) filter.difficulty = difficulty;
  if (type) filter.type = type;
  if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;
  if (search) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: re }, { description: re }, { tags: re }];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(safeLimit)
      .populate('moduleId', 'slug name')
      .populate('topicId', 'name')
      .populate('createdBy', 'name email'),
    Question.countDocuments(filter),
  ]);

  return { questions, total, page: safePage, limit: safeLimit, totalPages: Math.max(Math.ceil(total / safeLimit), 1) };
};

export const getAdminQuestionById = async (id) => {
  const question = await Question.findById(id)
    .populate('moduleId', 'slug name')
    .populate('topicId', 'name')
    .populate('createdBy', 'name email');
  if (!question) throw new ApiError(404, 'Question not found');
  return question;
};

export const createAdminQuestion = async (data, adminUser) => {
  const foundModule = await resolveModule(data.module);
  const topic = await resolveTopic(data.topicId);

  const question = await Question.create({
    title: data.title,
    description: data.description || '',
    difficulty: data.difficulty,
    type: data.type,
    expectedTime: data.expectedTime,
    hints: data.hints || [],
    solutionNotes: data.solutionNotes || '',
    tags: data.tags || [],
    moduleId: foundModule._id,
    topicId: topic._id,
    createdBy: null,
    source: 'system',
  });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CREATED_QUESTION',
    targetType: 'question',
    targetId: question._id,
    description: `Created ${foundModule.slug.toUpperCase()} question "${question.title}"`,
    metadata: { module: foundModule.slug, topic: topic.name, difficulty: question.difficulty },
  });

  return question;
};

export const updateAdminQuestion = async (id, data, adminUser) => {
  const question = await Question.findById(id);
  if (!question) throw new ApiError(404, 'Question not found');

  const changed = {};
  for (const field of ['title', 'description', 'difficulty', 'type', 'expectedTime', 'solutionNotes']) {
    if (data[field] !== undefined && data[field] !== question[field]) {
      changed[field] = { from: question[field], to: data[field] };
      question[field] = data[field];
    }
  }
  for (const field of ['hints', 'tags']) {
    if (data[field] !== undefined && JSON.stringify(data[field]) !== JSON.stringify(question[field])) {
      changed[field] = { from: question[field], to: data[field] };
      question[field] = data[field];
    }
  }
  if (data.topicId !== undefined && data.topicId !== question.topicId.toString()) {
    const topic = await resolveTopic(data.topicId);
    changed.topicId = { from: question.topicId.toString(), to: topic._id.toString() };
    question.topicId = topic._id;
  }
  if (data.module !== undefined) {
    const foundModule = await resolveModule(data.module);
    if (foundModule._id.toString() !== question.moduleId.toString()) {
      changed.module = { from: question.moduleId.toString(), to: foundModule._id.toString() };
      question.moduleId = foundModule._id;
    }
  }

  if (Object.keys(changed).length === 0) return question;

  await question.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_QUESTION',
    targetType: 'question',
    targetId: question._id,
    description: `Updated question "${question.title}"`,
    metadata: { changed },
  });

  return question;
};

// No cascade needed here (unlike Topic -> Question): nothing else holds a
// live reference to a Question that would dangle. MockInterview stores a
// title/topic/difficulty *snapshot* at creation time specifically so a
// soft-deleted or edited Question never breaks past mock history.
export const deleteAdminQuestion = async (id, adminUser) => {
  const question = await Question.findById(id);
  if (!question) throw new ApiError(404, 'Question not found');
  if (!question.isActive) return question;

  question.isActive = false;
  await question.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_QUESTION',
    targetType: 'question',
    targetId: question._id,
    description: `Deleted question "${question.title}"`,
  });

  return question;
};

export const restoreAdminQuestion = async (id, adminUser) => {
  const question = await Question.findById(id);
  if (!question) throw new ApiError(404, 'Question not found');
  if (question.isActive) return question;

  question.isActive = true;
  await question.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_RESTORED_QUESTION',
    targetType: 'question',
    targetId: question._id,
    description: `Restored question "${question.title}"`,
  });

  return question;
};
