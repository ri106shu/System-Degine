// Centralized route paths so a URL never has to be retyped by hand across
// the app. When HLD ships, its routes are added here, not invented ad hoc.
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  DASHBOARD: '/dashboard',
  ROADMAP: '/roadmap',
  TOPICS: '/topics',
  QUESTIONS: '/questions',
  MOCK_INTERVIEW: '/mock-interview',
  MOCK_SESSION: (id) => `/mock-interview/session/${id}`,
  MOCK_RESULT: (id) => `/mock-interview/result/${id}`,
  MOCK_HISTORY: '/mock-history',
  MOCK_HISTORY_DETAIL: (id) => `/mock-history/${id}`,
  ANALYTICS: '/analytics',
  ACHIEVEMENTS: '/achievements',
  NOTES: '/notes',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_TOPICS: '/admin/topics',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_PROMPTS: '/admin/topic-prompts',
  ADMIN_NOTES: '/admin/notes',
  ADMIN_ROADMAPS: '/admin/roadmaps',
  ADMIN_ROADMAP_LLD: '/admin/roadmaps/lld',
  ADMIN_ROADMAP_HLD: '/admin/roadmaps/hld',
  ADMIN_ROADMAP_DETAIL: (id) => `/admin/roadmaps/${id}`,
  ADMIN_MOCKS: '/admin/mocks',
  ADMIN_MOCK_DETAIL: (id) => `/admin/mocks/${id}`,
  ADMIN_TIMING: '/admin/interview-timing',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
};

export const MODULE_SLUGS = {
  LLD: 'lld',
  HLD: 'hld',
};

// The one place that decides where a session lands after authenticating —
// used identically after login, after registration, and when an
// already-authenticated user reaches a public-only page like /login. An
// admin never sees the user dashboard as a "landing page with extra menu
// items"; they land in the Admin application immediately.
export const getPostAuthRoute = (user) => (user?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD);
