import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import topicReducer from '../features/topics/topicSlice';
import questionReducer from '../features/questions/questionSlice';
import progressReducer from '../features/progress/progressSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import mockReducer from '../features/mock/mockSlice';
import roadmapReducer from '../features/roadmap/roadmapSlice';
import timingReducer from '../features/timing/timingSlice';
import adminReducer from '../features/admin/adminSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import achievementsReducer from '../features/achievements/achievementsSlice';
import adminTopicsReducer from '../features/adminTopics/adminTopicsSlice';
import adminQuestionsReducer from '../features/adminQuestions/adminQuestionsSlice';
import adminPromptsReducer from '../features/adminPrompts/adminPromptsSlice';
import adminRoadmapReducer from '../features/adminRoadmap/adminRoadmapSlice';
import adminMockInterviewsReducer from '../features/adminMockInterviews/adminMockInterviewsSlice';
import adminAnalyticsReducer from '../features/adminAnalytics/adminAnalyticsSlice';
import adminAuditLogReducer from '../features/adminAuditLog/adminAuditLogSlice';
import notesReducer from '../features/notes/notesSlice';
import adminNotesReducer from '../features/adminNotes/adminNotesSlice';
import adminSettingsReducer from '../features/adminSettings/adminSettingsSlice';
import themeReducer from './themeSlice';
import moduleReducer from './moduleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    modules: moduleReducer,
    topics: topicReducer,
    questions: questionReducer,
    progress: progressReducer,
    dashboard: dashboardReducer,
    mock: mockReducer,
    roadmap: roadmapReducer,
    timing: timingReducer,
    admin: adminReducer,
    analytics: analyticsReducer,
    achievements: achievementsReducer,
    adminTopics: adminTopicsReducer,
    adminQuestions: adminQuestionsReducer,
    adminPrompts: adminPromptsReducer,
    adminRoadmap: adminRoadmapReducer,
    adminMockInterviews: adminMockInterviewsReducer,
    adminAnalytics: adminAnalyticsReducer,
    adminAuditLog: adminAuditLogReducer,
    notes: notesReducer,
    adminNotes: adminNotesReducer,
    adminSettings: adminSettingsReducer,
  },
});
