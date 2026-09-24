import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { toggleTheme } from '../../store/themeSlice';
import { logoutUser } from '../../features/auth/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../hooks/useThemeMode';
import { ROUTES } from '../../app/constants';
import toast from 'react-hot-toast';

export default function Topbar({ onMenuClick, title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = useThemeMode();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate(ROUTES.HOME);
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        {title && (
          <h1 className="text-base font-bold text-[#16181D] dark:text-[#E9EAEC]">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="mx-1 hidden items-center gap-2 rounded-lg border border-[var(--color-border)] py-1 pl-1 pr-3 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-semibold text-[var(--color-accent)]">
            {initial}
          </span>
          <span className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">
            {user?.name || 'Account'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
