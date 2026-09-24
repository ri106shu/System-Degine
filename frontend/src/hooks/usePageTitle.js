import { useLocation } from 'react-router';
import { ROUTES } from '../app/constants';

const PAGE_TITLES = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.ROADMAP]: 'Roadmap',
  [ROUTES.TOPICS]: 'Topics',
  [ROUTES.QUESTIONS]: 'Questions',
  [ROUTES.MOCK_INTERVIEW]: 'Mock interview',
  [ROUTES.MOCK_HISTORY]: 'Mock history',
  [ROUTES.ANALYTICS]: 'Analytics',
  [ROUTES.ACHIEVEMENTS]: 'Achievements',
  [ROUTES.NOTES]: 'Notes',
  [ROUTES.PROFILE]: 'Profile',
  [ROUTES.SETTINGS]: 'Settings',

  [ROUTES.ADMIN_DASHBOARD]: 'Admin \u00b7 Dashboard',
  [ROUTES.ADMIN_TOPICS]: 'Admin \u00b7 Topics',
  [ROUTES.ADMIN_QUESTIONS]: 'Admin \u00b7 Questions',
  [ROUTES.ADMIN_PROMPTS]: 'Admin \u00b7 Topic prompts',
  [ROUTES.ADMIN_NOTES]: 'Admin \u00b7 User Notes',
  [ROUTES.ADMIN_ROADMAPS]: 'Admin \u00b7 Roadmaps',
  [ROUTES.ADMIN_MOCKS]: 'Admin \u00b7 Mock interviews',
  [ROUTES.ADMIN_TIMING]: 'Admin \u00b7 Interview timing',
  [ROUTES.ADMIN_ANALYTICS]: 'Admin \u00b7 Analytics',
  [ROUTES.ADMIN_SETTINGS]: 'Admin \u00b7 Settings',
  [ROUTES.ADMIN_AUDIT_LOGS]: 'Admin \u00b7 Audit log',
};

// A plain pathname lookup, not route `handle` + useMatches() — useMatches()
// only works with the data-router API (createBrowserRouter/RouterProvider),
// and this app uses the plain <BrowserRouter>. useLocation() works in both.
export function usePageTitle() {
  const { pathname } = useLocation();
  return PAGE_TITLES[pathname];
}
