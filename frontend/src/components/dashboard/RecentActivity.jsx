import { CheckCircle2, CircleDot, Activity } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

const relativeTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function RecentActivity({ items }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Recent activity</h3>
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Mark a topic or question as in progress or completed and it shows up here."
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Recent activity</h3>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.status === 'completed' ? CheckCircle2 : CircleDot;
          const verb =
            item.status === 'completed'
              ? item.targetType === 'question'
                ? 'Solved'
                : 'Completed'
              : 'Started';
          return (
            <div key={`${item.targetType}-${item.targetId}`} className="flex items-center gap-2.5 px-1 py-1.5 text-sm">
              <Icon
                size={14}
                className={item.status === 'completed' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-[#16181D] dark:text-[#E9EAEC]">
                {verb} <span className="text-[var(--color-text-secondary)]">{item.name}</span>
              </span>
              <span className="shrink-0 text-xs text-[var(--color-text-faint)]">{relativeTime(item.updatedAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
