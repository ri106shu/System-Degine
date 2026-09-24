import { Circle, CircleDot, CircleCheck, Trash2, FileText, FilePlus } from 'lucide-react';
import DifficultyBadge from '../ui/DifficultyBadge';
import { cn } from '../../utils/cn';

const STATUS_META = {
  not_started: { icon: Circle, label: 'Not started', color: 'text-[var(--color-text-faint)]' },
  in_progress: { icon: CircleDot, label: 'In progress', color: 'text-[var(--color-warning)]' },
  completed: { icon: CircleCheck, label: 'Completed', color: 'text-[var(--color-success)]' },
};

// readOnly + moduleBadge let Mock Interview reuse this exact row for its
// completed-topics preview (sections 22, 26 of that brief: no Add/Edit/
// Delete there, and a [LLD]/[HLD] badge in mixed mode) without forking the
// component the Topics page already uses. The note button follows the same
// rule — Mock Interview's read-only preview never shows it either.
export default function TopicRow({
  topic,
  status = 'not_started',
  currentUserId,
  onSetStatus,
  onRequestDelete,
  readOnly = false,
  moduleBadge,
  questionCount,
  hasNote,
  onOpenNote,
}) {
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const isOwner = topic.createdBy?._id === currentUserId;
  const nextStatus = status === 'completed' ? 'not_started' : 'completed';

  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0">
      {readOnly ? (
        <StatusIcon size={18} className={cn('mt-0.5 shrink-0', meta.color)} aria-hidden="true" />
      ) : (
        <button
          type="button"
          onClick={() => onSetStatus(topic._id, nextStatus)}
          className="mt-0.5 shrink-0"
          aria-label={status === 'completed' ? 'Mark not started' : 'Mark complete'}
          title={status === 'completed' ? 'Mark not started' : 'Mark complete'}
        >
          <StatusIcon size={18} className={meta.color} />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {moduleBadge && (
            <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              {moduleBadge}
            </span>
          )}
          <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">{topic.name}</p>
          {!readOnly && topic.source === 'user' && (
            <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-faint)]">
              {isOwner ? 'Created by you' : 'User topic'}
            </span>
          )}
        </div>
        {topic.description && (
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{topic.description}</p>
        )}
        <p className={cn('mt-1 text-xs', meta.color)}>{meta.label}</p>
        {questionCount !== undefined && (
          <p className="mt-1 text-xs text-[var(--color-text-faint)]">
            {questionCount} question{questionCount === 1 ? '' : 's'} completed
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DifficultyBadge difficulty={topic.difficulty} className="mt-0.5" />
        {!readOnly && (
          <button
            type="button"
            onClick={() => onOpenNote(topic)}
            className={cn(
              'rounded-lg p-1.5',
              hasNote
                ? 'text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]'
                : 'text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)]'
            )}
            aria-label={hasNote ? `View note for ${topic.name}` : `Add note for ${topic.name}`}
            title={hasNote ? 'View note' : 'Add note'}
          >
            {hasNote ? <FileText size={15} /> : <FilePlus size={15} />}
          </button>
        )}
        {!readOnly && isOwner && (
          <button
            type="button"
            onClick={() => onRequestDelete(topic)}
            className="rounded-lg p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
            aria-label={`Delete ${topic.name}`}
            title="Delete topic"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
