import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import AdminRoute from './AdminRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import AdminLayout from '../components/layout/AdminLayout';
import AuthLayout from '../components/layout/AuthLayout';
import PageLoader from '../components/ui/PageLoader';
import { ROUTES } from '../app/constants';
import { useAuth } from '../hooks/useAuth';

// Route-based code splitting (section 36: lazy-loaded routes).
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const TopicsPage = lazy(() => import('../pages/TopicsPage'));
const QuestionsPage = lazy(() => import('../pages/QuestionsPage'));
const MockInterviewPage = lazy(() => import('../pages/MockInterviewPage'));
const MockSessionPage = lazy(() => import('../pages/MockSessionPage'));
const MockResultPage = lazy(() => import('../pages/MockResultPage'));
const MockHistoryPage = lazy(() => import('../pages/MockHistoryPage'));
const RoadmapPage = lazy(() => import('../pages/RoadmapPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ComingSoonPage = lazy(() => import('../pages/ComingSoonPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminTopicsPage = lazy(() => import('../pages/admin/AdminTopicsPage'));
const AdminQuestionsPage = lazy(() => import('../pages/admin/AdminQuestionsPage'));
const AdminPromptsPage = lazy(() => import('../pages/admin/AdminPromptsPage'));
const AdminRoadmapPage = lazy(() => import('../pages/admin/AdminRoadmapPage'));
const AdminMockInterviewsPage = lazy(() => import('../pages/admin/AdminMockInterviewsPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
const AdminAuditLogPage = lazy(() => import('../pages/admin/AdminAuditLogPage'));
const AdminNotesPage = lazy(() => import('../pages/admin/AdminNotesPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
const AnalyticsPage = lazy(() => import('../pages/AnalyticsPage'));
const AchievementsPage = lazy(() => import('../pages/AchievementsPage'));
const NotesPage = lazy(() => import('../pages/NotesPage'));

const comingSoon = (title, description) => <ComingSoonPage title={title} description={description} />;

// Case 8 of the admin-separation brief: an admin has a separate analytics
// experience and should never land on their own (empty, irrelevant)
// personal analytics just because they followed the normal user nav link.
function UserAnalyticsGate() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to={ROUTES.ADMIN_ANALYTICS} replace />;
  return <AnalyticsPage />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.ROADMAP} element={<RoadmapPage />} />
            <Route path={ROUTES.TOPICS} element={<TopicsPage />} />
            <Route path={ROUTES.QUESTIONS} element={<QuestionsPage />} />
            <Route path={ROUTES.MOCK_INTERVIEW} element={<MockInterviewPage />} />
            <Route path="/mock-interview/session/:sessionId" element={<MockSessionPage />} />
            <Route path="/mock-interview/result/:sessionId" element={<MockResultPage />} />
            <Route path={ROUTES.MOCK_HISTORY} element={<MockHistoryPage />} />
            <Route path="/mock-history/:sessionId" element={<MockResultPage />} />
            <Route path={ROUTES.ANALYTICS} element={<UserAnalyticsGate />} />
            <Route path={ROUTES.ACHIEVEMENTS} element={<AchievementsPage />} />
            <Route path={ROUTES.NOTES} element={<NotesPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
            <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
            <Route
              path="/admin/users/:id"
              element={comingSoon('Admin \u00b7 User detail', "A single user's preparation stats, mock history, and activity.")}
            />
            <Route path={ROUTES.ADMIN_TOPICS} element={<AdminTopicsPage />} />
            <Route path={ROUTES.ADMIN_QUESTIONS} element={<AdminQuestionsPage />} />
            <Route path={ROUTES.ADMIN_PROMPTS} element={<AdminPromptsPage />} />
            <Route path={ROUTES.ADMIN_NOTES} element={<AdminNotesPage />} />
            <Route path={ROUTES.ADMIN_ROADMAP_LLD} element={<AdminRoadmapPage module="lld" />} />
            <Route path={ROUTES.ADMIN_ROADMAP_HLD} element={<AdminRoadmapPage module="hld" />} />
            <Route path={ROUTES.ADMIN_ROADMAPS} element={<Navigate to={ROUTES.ADMIN_ROADMAP_LLD} replace />} />
            <Route path={ROUTES.ADMIN_MOCKS} element={<AdminMockInterviewsPage />} />
            <Route
              path={ROUTES.ADMIN_TIMING}
              element={comingSoon('Admin \u00b7 Interview timing', 'Edit the system-wide default timing that new mocks resolve against.')}
            />
            <Route path={ROUTES.ADMIN_ANALYTICS} element={<AdminAnalyticsPage />} />
            <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
            <Route path={ROUTES.ADMIN_AUDIT_LOGS} element={<AdminAuditLogPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
