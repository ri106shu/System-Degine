import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { Sun, Moon, LogOut } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import MockTimingSettings from '../components/settings/MockTimingSettings';
import { useAuth } from '../hooks/useAuth';
import { useThemeMode } from '../hooks/useThemeMode';
import { setTheme } from '../store/themeSlice';
import { logoutUser } from '../features/auth/authSlice';
import { fetchTiming } from '../features/timing/timingSlice';
import { ROUTES } from '../app/constants';
import { cn } from '../utils/cn';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = useThemeMode();
  const { data: timing, status: timingStatus } = useSelector((s) => s.timing);

  useEffect(() => {
    dispatch(fetchTiming());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate(ROUTES.HOME);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Settings</h2>

      <Card className="p-5">
        <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Appearance</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Switch between light and dark. This is saved on this device.
        </p>
        <div className="mt-4 flex gap-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => dispatch(setTheme(value))}
              className={cn(
                'flex flex-1 flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors',
                mode === value
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
              )}
              aria-pressed={mode === value}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-5">
        <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Account</p>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-secondary)]">Name</dt>
            <dd className="text-[#16181D] dark:text-[#E9EAEC]">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-text-secondary)]">Email</dt>
            <dd className="text-[#16181D] dark:text-[#E9EAEC]">{user?.email}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[var(--color-text-faint)]">
          Editing these fields isn't built yet.
        </p>
      </Card>

      <Card className="mt-5 p-5">
        <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Notifications</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Daily streak reminders are planned but not yet built — shown here so the setting
          has a home when they land, rather than a toggle that does nothing today.
        </p>
      </Card>

      <div className="mt-5">
        {timingStatus === 'loading' || timingStatus === 'idle' ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <MockTimingSettings timing={timing} />
        )}
      </div>

      <Button variant="danger" className="mt-5" onClick={handleLogout}>
        <LogOut size={16} aria-hidden="true" />
        Log out
      </Button>
    </div>
  );
}
