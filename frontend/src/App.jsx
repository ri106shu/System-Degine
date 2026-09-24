import { useEffect } from 'react';
import { BrowserRouter } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { fetchCurrentUser } from './features/auth/authSlice';

export default function App() {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);

  // Check for an existing httpOnly-cookie session exactly once on load.
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Class-based dark mode: keep <html class="dark"> in sync with the store.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}
