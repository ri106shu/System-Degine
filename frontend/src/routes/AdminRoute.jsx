import { Navigate, Outlet, Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PageLoader from '../components/ui/PageLoader';
import { ROUTES } from '../app/constants';

// This is a UX convenience only — the real boundary is requireAdmin on the
// backend, verified independently on every single /api/admin/* request.
// Hiding this page never substitutes for that; a determined non-admin user
// calling the API directly gets a 403 there regardless of what this route
// shows.
export default function AdminRoute() {
  const { user, isAuthenticated, initializing } = useAuth();

  if (initializing) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShieldAlert size={40} className="mb-4 text-[var(--color-danger)]" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">Admin access required</h1>
        <p className="mt-1.5 max-w-sm text-sm text-[var(--color-text-secondary)]">
          This section is for administrators only. Your account doesn't have admin access.
        </p>
        <Link to={ROUTES.DASHBOARD} className="mt-4 text-sm font-medium text-[var(--color-accent)]">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
