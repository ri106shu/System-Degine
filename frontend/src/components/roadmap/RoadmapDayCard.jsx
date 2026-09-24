import { useState } from 'react';
import { Circle, CircleDot, CircleCheck, Clock, Coffee } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const STATUS_META = {
  not_started: { icon: Circle, label: 'Not started', color: 'text-[var(--color-text-faint)]' },
  in_progress: { icon: CircleDot, label: 'In progress', color: 'text-[var(--color-warning)]' },
  completed: { icon: CircleCheck, label: 'Completed', color: 'text-[var(--color-success)]' },
};

export default function RoadmapDayCard({ day, onSetStatus, updating, isCurrent }) {
  const [expanded, setExpanded] = useState(false);

  if (day.dayType === 'rest') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/40 px-4 py-3">
        <Coffee size={16} className="shrink-0 text-[var(--color-text-faint)]" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-faint)]">Day {day.dayNumber} · Rest day</p>
          <p className="text-xs text-[var(--color-text-faint)]">{day.focus}</p>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[day.status] || STATUS_META.not_started;
  const StatusIcon = meta.icon;

  return (
    <div
      className={cn(
        'rounded-xl border bg-[var(--color-surface)]',
        isCurrent ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        <StatusIcon size={18} className={cn('mt-0.5 shrink-0', meta.color)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Day {day.dayNumber}</p>
            {isCurrent && (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                Current
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{day.focus}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
            {day.time && (
              <span className="flex items-center gap-1 text-[var(--color-text-faint)]">
                <Clock size={12} aria-hidden="true" />
                {day.time}
              </span>
            )}
            <span className={cn('font-medium', meta.color)}>{meta.label}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] p-4">
          {day.status !== 'in_progress' && (
            <Button variant="secondary" size="sm" disabled={updating} onClick={() => onSetStatus(day._id, 'in_progress')}>
              Mark in progress
            </Button>
          )}
          {day.status !== 'completed' && (
            <Button size="sm" disabled={updating} onClick={() => onSetStatus(day._id, 'completed')}>
              Mark complete
            </Button>
          )}
          {day.status !== 'not_started' && (
            <Button variant="ghost" size="sm" disabled={updating} onClick={() => onSetStatus(day._id, 'not_started')}>
              Reset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
