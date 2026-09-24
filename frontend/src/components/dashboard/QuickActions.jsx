import { Link } from 'react-router';
import { Plus, HelpCircle, Mic, Map } from 'lucide-react';
import { ROUTES } from '../../app/constants';

const ACTIONS = [
  { to: `${ROUTES.TOPICS}?module=lld&add=true`, label: 'Add topic', icon: Plus },
  { to: `${ROUTES.QUESTIONS}?module=lld&add=true`, label: 'Add question', icon: HelpCircle },
  { to: `${ROUTES.MOCK_INTERVIEW}?mode=lld`, label: 'Start LLD mock', icon: Mic },
  { to: `${ROUTES.MOCK_INTERVIEW}?mode=hld`, label: 'Start HLD mock', icon: Mic },
  { to: `${ROUTES.MOCK_INTERVIEW}?mode=mixed`, label: 'Start LLD + HLD mock', icon: Mic },
  { to: ROUTES.ROADMAP, label: 'Open roadmap', icon: Map },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Quick actions</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ACTIONS.map(({ to, label, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC] hover:bg-[var(--color-surface-2)]"
          >
            <Icon size={15} className="shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
