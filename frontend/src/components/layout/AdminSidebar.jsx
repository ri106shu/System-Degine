import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  Layers,
  ListChecks,
  MessageCircleQuestion,
  FileText,
  Map,
  Mic,
  Clock,
  BarChart3,
  Settings,
  ScrollText,
} from 'lucide-react';
import Logo from '../ui/Logo';
import { ROUTES } from '../../app/constants';
import { cn } from '../../utils/cn';

// No Users section, anywhere — Admin manages platform content, never user
// accounts. See the README's Admin panel section for the reasoning.
const NAV_SECTIONS = [
  {
    label: 'Admin',
    items: [{ to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Content',
    items: [
      { to: ROUTES.ADMIN_TOPICS, label: 'Topics', icon: Layers },
      { to: ROUTES.ADMIN_QUESTIONS, label: 'Questions', icon: ListChecks },
      { to: ROUTES.ADMIN_PROMPTS, label: 'Topic prompts', icon: MessageCircleQuestion },
      { to: ROUTES.ADMIN_NOTES, label: 'User Notes', icon: FileText },
    ],
  },
  {
    label: 'Roadmaps',
    items: [
      { to: ROUTES.ADMIN_ROADMAP_LLD, label: 'LLD roadmap', icon: Map },
      { to: ROUTES.ADMIN_ROADMAP_HLD, label: 'HLD roadmap', icon: Map },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { to: ROUTES.ADMIN_ANALYTICS, label: 'Analytics', icon: BarChart3 },
      { to: ROUTES.ADMIN_MOCKS, label: 'Mock interviews', icon: Mic },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: ROUTES.ADMIN_TIMING, label: 'Interview timing', icon: Clock },
      { to: ROUTES.ADMIN_SETTINGS, label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Security',
    items: [{ to: ROUTES.ADMIN_AUDIT_LOGS, label: 'Audit log', icon: ScrollText }],
  },
];

export default function AdminSidebar({ onNavigate }) {
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <div className="px-2">
        <Logo />
        <span className="mt-1.5 inline-block rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          Admin
        </span>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-2 text-xs font-medium text-[var(--color-text-faint)]">{section.label}</p>
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
