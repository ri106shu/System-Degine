import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';
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

export const getAdminPromptList = async ({ module, search, topicId, difficulty, status = 'active', page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (module && module !== 'all') {
    const foundModule = await Module.findOne({ slug: module });
    filter.moduleId = foundModule?._id || null;
  }
  if (topicId) filter.topicId = topicId;
  if (difficulty) filter.difficulty = difficulty;
  if (status === 'active') filter.isActive = true;
  else if (status === 'inactive') filter.isActive = false;
  if (search) {
    const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ prompt: re }, { category: re }];
  }

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [prompts, total] = await Promise.all([
    TopicInterviewPrompt.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(safeLimit)
      .populate('moduleId', 'slug name')
      .populate('topicId', 'name'),
    TopicInterviewPrompt.countDocuments(filter),
  ]);

  return { prompts, total, page: safePage, limit: safeLimit, totalPages: Math.max(Math.ceil(total / safeLimit), 1) };
};

export const getAdminPromptById = async (id) => {
  const prompt = await TopicInterviewPrompt.findById(id).populate('moduleId', 'slug name').populate('topicId', 'name');
  if (!prompt) throw new ApiError(404, 'Prompt not found');
  return prompt;
};

export const createAdminPrompt = async (data, adminUser) => {
  const foundModule = await resolveModule(data.module);
  const topic = await resolveTopic(data.topicId);

  const prompt = await TopicInterviewPrompt.create({
    prompt: data.prompt,
    followUps: data.followUps || [],
    difficulty: data.difficulty,
    category: data.category,
    moduleId: foundModule._id,
    topicId: topic._id,
    createdBy: null,
    source: 'system',
  });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_CREATED_PROMPT',
    targetType: 'topicPrompt',
    targetId: prompt._id,
    description: `Created ${foundModule.slug.toUpperCase()} prompt for "${topic.name}"`,
    metadata: { module: foundModule.slug, topic: topic.name, difficulty: prompt.difficulty },
  });

  return prompt;
};

export const updateAdminPrompt = async (id, data, adminUser) => {
  const prompt = await TopicInterviewPrompt.findById(id);
  if (!prompt) throw new ApiError(404, 'Prompt not found');

  const changed = {};
  for (const field of ['prompt', 'difficulty', 'category']) {
    if (data[field] !== undefined && data[field] !== prompt[field]) {
      changed[field] = { from: prompt[field], to: data[field] };
      prompt[field] = data[field];
    }
  }
  if (data.followUps !== undefined && JSON.stringify(data.followUps) !== JSON.stringify(prompt.followUps)) {
    changed.followUps = { from: prompt.followUps, to: data.followUps };
    prompt.followUps = data.followUps;
  }
  if (data.topicId !== undefined && data.topicId !== prompt.topicId.toString()) {
    const topic = await resolveTopic(data.topicId);
    changed.topicId = { from: prompt.topicId.toString(), to: topic._id.toString() };
    prompt.topicId = topic._id;
  }
  if (data.module !== undefined) {
    const foundModule = await resolveModule(data.module);
    if (foundModule._id.toString() !== prompt.moduleId.toString()) {
      changed.module = { from: prompt.moduleId.toString(), to: foundModule._id.toString() };
      prompt.moduleId = foundModule._id;
    }
  }

  if (Object.keys(changed).length === 0) return prompt;

  await prompt.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_PROMPT',
    targetType: 'topicPrompt',
    targetId: prompt._id,
    description: `Updated topic prompt`,
    metadata: { changed },
  });

  return prompt;
};

export const deleteAdminPrompt = async (id, adminUser) => {
  const prompt = await TopicInterviewPrompt.findById(id);
  if (!prompt) throw new ApiError(404, 'Prompt not found');
  if (!prompt.isActive) return prompt;

  prompt.isActive = false;
  await prompt.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_PROMPT',
    targetType: 'topicPrompt',
    targetId: prompt._id,
    description: `Deleted topic prompt`,
  });

  return prompt;
};

export const restoreAdminPrompt = async (id, adminUser) => {
  const prompt = await TopicInterviewPrompt.findById(id);
  if (!prompt) throw new ApiError(404, 'Prompt not found');
  if (prompt.isActive) return prompt;

  prompt.isActive = true;
  await prompt.save();

  await logAdminAction({
    adminUser,
    action: 'ADMIN_RESTORED_PROMPT',
    targetType: 'topicPrompt',
    targetId: prompt._id,
    description: `Restored topic prompt`,
  });

  return prompt;
};
