import mongoose from 'mongoose';

// A genuine singleton: exactly one document, found via a well-known id
// rather than any query that could accidentally match more than one.
const SETTINGS_ID = 'singleton';

const systemSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: SETTINGS_ID },

    platform: {
      name: { type: String, default: 'InterviewForge' },
      description: { type: String, default: 'Interview preparation platform for LLD and HLD interviews.' },
    },

    modules: {
      lldEnabled: { type: Boolean, default: true },
      hldEnabled: { type: Boolean, default: true },
    },

    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "InterviewForge is temporarily unavailable. We'll be back shortly." },
      allowAdminAccess: { type: Boolean, default: true },
    },

    mockInterview: {
      lldEnabled: { type: Boolean, default: true },
      hldEnabled: { type: Boolean, default: true },
      mixedEnabled: { type: Boolean, default: true },
      easyEnabled: { type: Boolean, default: true },
      mediumEnabled: { type: Boolean, default: true },
      hardEnabled: { type: Boolean, default: true },
      defaultDuration: {
        easy: { type: Number, default: 30 },
        medium: { type: Number, default: 45 },
        hard: { type: Number, default: 60 },
      },
      defaultQuestionCount: { type: Number, default: 10 },
    },

    content: {
      defaultTopicActive: { type: Boolean, default: true },
      defaultQuestionActive: { type: Boolean, default: true },
      defaultPromptActive: { type: Boolean, default: true },
      topicsPerPage: { type: Number, default: 20 },
      questionsPerPage: { type: Number, default: 20 },
      notesPerPage: { type: Number, default: 20 },
    },

    notifications: {
      newUserRegistration: { type: Boolean, default: true },
      newUserNote: { type: Boolean, default: false },
      contentChanges: { type: Boolean, default: true },
      systemErrors: { type: Boolean, default: true },
      maintenanceAlerts: { type: Boolean, default: true },
    },

    dashboard: {
      platformStatistics: { type: Boolean, default: true },
      lldStatistics: { type: Boolean, default: true },
      hldStatistics: { type: Boolean, default: true },
      recentContentActivity: { type: Boolean, default: true },
      recentUserNotes: { type: Boolean, default: true },
      mockStatistics: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
      auditActivity: { type: Boolean, default: true },
    },

    system: {
      timezone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD MMM YYYY' },
      timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const SYSTEM_SETTINGS_ID = SETTINGS_ID;
export default mongoose.model('SystemSettings', systemSettingsSchema);
