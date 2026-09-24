// A static catalog, not a DB collection — these are fixed unlock rules
// (target thresholds, categories), not user-editable content the way
// Topics/Questions are. Only the per-user EARNED record (UserAchievement)
// needs real persistence; the definitions themselves are code, the same way
// the interview-timing tiers started as fixed defaults before user
// overrides existed. Every `metric` key here must have a matching
// computation in achievementMetrics.js — checked by a test, not by hand.
export const ACHIEVEMENTS = [
  // --- Topics ---
  { key: 'first-step', name: 'First Step', description: 'Complete your first topic.', category: 'topics', icon: 'Footprints', metric: 'completedTopics', target: 1 },
  { key: 'topic-explorer', name: 'Topic Explorer', description: 'Complete 10 topics.', category: 'topics', icon: 'Compass', metric: 'completedTopics', target: 10 },
  { key: 'topic-master', name: 'Topic Master', description: 'Complete 25 topics.', category: 'topics', icon: 'Layers', metric: 'completedTopics', target: 25 },
  { key: 'topic-expert', name: 'Topic Expert', description: 'Complete 50 topics.', category: 'topics', icon: 'GraduationCap', metric: 'completedTopics', target: 50 },

  // --- Questions ---
  { key: 'question-starter', name: 'Question Starter', description: 'Complete your first question.', category: 'questions', icon: 'ListChecks', metric: 'completedQuestions', target: 1 },
  { key: 'problem-solver', name: 'Problem Solver', description: 'Complete 25 questions.', category: 'questions', icon: 'Puzzle', metric: 'completedQuestions', target: 25 },
  { key: 'problem-crusher', name: 'Problem Crusher', description: 'Complete 50 questions.', category: 'questions', icon: 'Hammer', metric: 'completedQuestions', target: 50 },

  // --- Mock interviews ---
  { key: 'mock-beginner', name: 'Mock Beginner', description: 'Complete your first mock interview.', category: 'mocks', icon: 'Mic', metric: 'completedMocks', target: 1 },
  { key: 'mock-warrior', name: 'Mock Warrior', description: 'Complete 10 mock interviews.', category: 'mocks', icon: 'Swords', metric: 'completedMocks', target: 10 },
  { key: 'mock-master', name: 'Mock Master', description: 'Complete 25 mock interviews.', category: 'mocks', icon: 'Crown', metric: 'completedMocks', target: 25 },

  // --- Roadmap ---
  { key: 'roadmap-starter', name: 'Roadmap Starter', description: 'Complete your first roadmap day.', category: 'roadmap', icon: 'Map', metric: 'completedRoadmapDays', target: 1 },
  { key: 'roadmap-runner', name: 'Roadmap Runner', description: 'Complete 10 roadmap study days.', category: 'roadmap', icon: 'Footprints', metric: 'completedRoadmapDays', target: 10 },
  { key: 'roadmap-master', name: 'Roadmap Master', description: 'Complete an entire roadmap.', category: 'roadmap', icon: 'FlagTriangleRight', metric: 'roadmapFullyCompleted', target: 1 },

  // --- Streaks ---
  { key: 'streak-7', name: '7 Day Streak', description: 'Maintain a 7-day preparation streak.', category: 'streaks', icon: 'Flame', metric: 'longestStreak', target: 7 },
  { key: 'streak-14', name: '14 Day Streak', description: 'Maintain a 14-day preparation streak.', category: 'streaks', icon: 'Flame', metric: 'longestStreak', target: 14 },
  { key: 'streak-30', name: '30 Day Streak', description: 'Maintain a 30-day preparation streak.', category: 'streaks', icon: 'Flame', metric: 'longestStreak', target: 30 },

  // --- LLD ---
  { key: 'lld-beginner', name: 'LLD Beginner', description: 'Complete 10 LLD topics.', category: 'lld', icon: 'Blocks', metric: 'completedLldTopics', target: 10 },
  { key: 'lld-master', name: 'LLD Master', description: 'Complete 50 LLD topics.', category: 'lld', icon: 'Castle', metric: 'completedLldTopics', target: 50 },

  // --- HLD ---
  { key: 'hld-beginner', name: 'HLD Beginner', description: 'Complete 10 HLD topics.', category: 'hld', icon: 'Network', metric: 'completedHldTopics', target: 10 },
  { key: 'hld-master', name: 'HLD Master', description: 'Complete 50 HLD topics.', category: 'hld', icon: 'Server', metric: 'completedHldTopics', target: 50 },
];

export const ACHIEVEMENT_CATEGORIES = ['topics', 'questions', 'mocks', 'roadmap', 'streaks', 'lld', 'hld'];

export const getAchievementByKey = (key) => ACHIEVEMENTS.find((a) => a.key === key);
