import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/ui/PageLoader';
import { ROUTES } from '../app/constants';

// Guards every authenticated section. While we don't yet know if a session
// cookie is valid, we show a loader rather than flashing the login page.
export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Outlet />;
}
