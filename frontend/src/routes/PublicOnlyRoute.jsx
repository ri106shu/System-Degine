import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/ui/PageLoader';
import { getPostAuthRoute } from '../app/constants';

// Keeps a logged-in user off the login/register screens.
export default function PublicOnlyRoute() {
  const { user, isAuthenticated, initializing } = useAuth();

  if (initializing) return <PageLoader />;
  if (isAuthenticated) return <Navigate to={getPostAuthRoute(user)} replace />;
  return <Outlet />;
}
