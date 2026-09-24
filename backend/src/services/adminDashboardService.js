import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import TopicInterviewPrompt from '../models/TopicInterviewPrompt.js';
import Roadmap from '../models/Roadmap.js';
import MockInterview from '../models/MockInterview.js';
import Module from '../models/Module.js';

const countByModule = async (Model, extraFilter = {}) => {
  const modules = await Module.find({});
  const result = {};
  for (const m of modules) {
    result[m.slug] = await Model.countDocuments({ moduleId: m._id, isActive: true, ...extraFilter });
  }
  return result;
};

const recentContent = async (Model, limit = 5) => {
  const [recentlyAdded, recentlyUpdated] = await Promise.all([
    Model.find({ isActive: true }).sort('-createdAt').limit(limit).select('name title createdAt updatedAt moduleId').populate('moduleId', 'slug'),
    Model.find({ isActive: true }).sort('-updatedAt').limit(limit).select('name title createdAt updatedAt moduleId').populate('moduleId', 'slug'),
  ]);
  const toEntry = (doc) => ({
    id: doc._id,
    label: doc.name || doc.title,
    module: doc.moduleId?.slug,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
  return {
    recentlyAdded: recentlyAdded.map(toEntry),
    // "Updated" as distinct from "added" — a doc whose updatedAt hasn't
    // moved past its createdAt by more than a second hasn't really been
    // edited since creation, just saved once.
    recentlyUpdated: recentlyUpdated.filter((d) => d.updatedAt - d.createdAt > 1000).map(toEntry),
  };
};

// This is a PLATFORM dashboard — what content exists, what's being used —
// never a per-user or account-management view. No User model import here
// at all; that's deliberate, not an oversight, now that Admin doesn't
// manage user accounts.
export const getAdminDashboardStats = async () => {
  const [topicsByModule, questionsByModule, promptsByModule, roadmapsByModule, mockStatusCounts, topicActivity, questionActivity] =
    await Promise.all([
      countByModule(Topic),
      countByModule(Question),
      countByModule(TopicInterviewPrompt),
      countByModule(Roadmap),
      MockInterview.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      recentContent(Topic),
      recentContent(Question),
    ]);

  const mockStatusMap = { in_progress: 0, completed: 0, abandoned: 0 };
  for (const row of mockStatusCounts) if (row._id in mockStatusMap) mockStatusMap[row._id] = row.count;
  const totalMocks = Object.values(mockStatusMap).reduce((a, b) => a + b, 0);

  return {
    content: {
      lld: { topics: topicsByModule.lld || 0, questions: questionsByModule.lld || 0, prompts: promptsByModule.lld || 0, roadmaps: roadmapsByModule.lld || 0 },
      hld: { topics: topicsByModule.hld || 0, questions: questionsByModule.hld || 0, prompts: promptsByModule.hld || 0, roadmaps: roadmapsByModule.hld || 0 },
    },
    mocks: {
      total: totalMocks,
      completed: mockStatusMap.completed,
      inProgress: mockStatusMap.in_progress,
      abandoned: mockStatusMap.abandoned,
    },
    activity: {
      topics: topicActivity,
      questions: questionActivity,
    },
  };
};
