import { Link } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { ROUTES } from '../../app/constants';

export default function WeakAreas({ items }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Weak areas</h3>
        <EmptyState
          icon={AlertTriangle}
          title="No weak areas flagged yet"
          description="Rate your confidence (1–5) on a topic or question and anything at 2 or below shows up here."
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Weak areas</h3>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const listRoute = item.targetType === 'topic' ? ROUTES.TOPICS : ROUTES.QUESTIONS;
          return (
            <div
              key={`${item.targetType}-${item.targetId}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <AlertTriangle size={14} className="shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">{item.name}</p>
                  <p className="text-xs text-[var(--color-text-faint)]">Confidence: {item.confidence} / 5</p>
                </div>
              </div>
              <Link
                to={`${listRoute}?module=${item.module}`}
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
              >
                Review
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
