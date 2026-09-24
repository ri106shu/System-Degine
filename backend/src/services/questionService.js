import Question from '../models/Question.js';
import Topic from '../models/Topic.js';
import Module from '../models/Module.js';
import ApiError from '../utils/ApiError.js';

const isOwnerOrAdmin = (question, user) =>
  user.role === 'admin' || (question.createdBy && question.createdBy.toString() === user._id.toString());

export const listQuestions = async ({ moduleSlug, topicId, difficulty, search }) => {
  const filter = { isActive: true };

  if (moduleSlug) {
    const foundModule = await Module.findOne({ slug: moduleSlug });
    if (!foundModule) return [];
    filter.moduleId = foundModule._id;
  }
  if (topicId) filter.topicId = topicId;
  if (difficulty) filter.difficulty = difficulty;
  if (search) filter.$text = { $search: search };

  return Question.find(filter)
    .sort('difficulty title')
    .populate('topicId', 'name category')
    .populate('createdBy', 'name')
    .select('-solutionNotes'); // keep solutions out of the list view
};

export const getQuestion = async (id) => {
  const question = await Question.findOne({ _id: id, isActive: true })
    .populate('topicId', 'name category')
    .populate('createdBy', 'name');
  if (!question) throw new ApiError(404, 'Question not found');
  return question;
};

export const createQuestion = async (data, user) => {
  const foundModule = await Module.findOne({ slug: data.module });
  if (!foundModule) {
    throw new ApiError(400, 'Unknown module', [{ field: 'module', message: `No module with slug "${data.module}"` }]);
  }

  const topic = await Topic.findOne({ _id: data.topicId, isActive: true });
  if (!topic) {
    throw new ApiError(400, 'Topic not found', [{ field: 'topicId', message: 'That topic does not exist' }]);
  }
  // Server-side enforcement of "topic must belong to the selected module" —
  // the frontend only shows matching topics, but that's a UX convenience,
  // not the actual guarantee. This is.
  if (topic.moduleId.toString() !== foundModule._id.toString()) {
    throw new ApiError(400, 'Topic does not belong to the selected module', [
      { field: 'topicId', message: `"${topic.name}" is not an ${data.module.toUpperCase()} topic` },
    ]);
  }

  return Question.create({
    title: data.title,
    description: data.description,
    difficulty: data.difficulty,
    type: data.type || 'LLD Problem',
    expectedTime: data.expectedTime,
    hints: data.hints || [],
    solutionNotes: data.solutionNotes || '',
    tags: data.tags || [],
    moduleId: foundModule._id,
    topicId: topic._id,
    createdBy: user._id,
    source: 'user',
  });
};

export const updateQuestion = async (id, data, user) => {
  const question = await Question.findOne({ _id: id, isActive: true });
  if (!question) throw new ApiError(404, 'Question not found');
  if (!isOwnerOrAdmin(question, user)) {
    throw new ApiError(403, 'You can only edit questions you created');
  }

  ['title', 'description', 'difficulty', 'type', 'expectedTime', 'hints', 'solutionNotes', 'tags'].forEach(
    (field) => {
      if (data[field] !== undefined) question[field] = data[field];
    }
  );
  await question.save();
  return question;
};

// Soft-delete, same reasoning as topicService.deleteTopic — preserves
// referential integrity and any historical mock records automatically.
export const deleteQuestion = async (id, user) => {
  const question = await Question.findOne({ _id: id, isActive: true });
  if (!question) throw new ApiError(404, 'Question not found');
  if (!isOwnerOrAdmin(question, user)) {
    throw new ApiError(403, 'You can only delete questions you created');
  }

  question.isActive = false;
  await question.save();
  return question;
};
