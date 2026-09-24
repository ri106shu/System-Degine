import { useSelector } from 'react-redux';

// Thin convenience hook so components don't repeat the same selector.
export function useAuth() {
  const { user, status, initializing, error } = useSelector((state) => state.auth);
  return { user, status, initializing, error, isAuthenticated: Boolean(user) };
}
