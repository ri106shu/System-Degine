import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  Map,
  Layers,
  ListChecks,
  Mic,
  History,
  BarChart3,
  Trophy,
  StickyNote,
  User,
  Settings,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { ROUTES } from '../../app/constants';
import { cn } from '../../utils/cn';

const NAV_SECTIONS = [
  {
    label: 'Prepare',
    items: [
      { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { to: ROUTES.ROADMAP, label: 'Roadmap', icon: Map },
      { to: ROUTES.TOPICS, label: 'Topics', icon: Layers },
      { to: ROUTES.QUESTIONS, label: 'Questions', icon: ListChecks },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: ROUTES.MOCK_INTERVIEW, label: 'Mock interview', icon: Mic },
      { to: ROUTES.MOCK_HISTORY, label: 'Mock history', icon: History },
      { to: ROUTES.ANALYTICS, label: 'Analytics', icon: BarChart3 },
      { to: ROUTES.ACHIEVEMENTS, label: 'Achievements', icon: Trophy },
    ],
  },
  {
    label: 'Yours',
    items: [
      { to: ROUTES.NOTES, label: 'Notes', icon: StickyNote },
      { to: ROUTES.PROFILE, label: 'Profile', icon: User },
      { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Logo className="px-2" />

      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-2 text-xs font-medium text-[var(--color-text-faint)]">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[#16181D] dark:hover:text-[#E9EAEC]'
                    )
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
