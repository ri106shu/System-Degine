import { useState } from 'react';
import { ChevronDown, Clock, Lightbulb, Eye, Trash2, CircleCheck, FileText, FilePlus } from 'lucide-react';
import DifficultyBadge from '../ui/DifficultyBadge';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

const STATUS_LABELS = {
  not_started: 'Not solved',
  in_progress: 'Attempted',
  completed: 'Completed',
};
const STATUS_COLORS = {
  not_started: 'text-[var(--color-text-faint)]',
  in_progress: 'text-[var(--color-warning)]',
  completed: 'text-[var(--color-success)]',
};

export default function QuestionCard({
  question,
  status = 'not_started',
  currentUserId,
  onSetStatus,
  onRequestDelete,
  readOnly = false,
  moduleBadge,
  hasNote,
  onOpenNote,
}) {
  const [expanded, setExpanded] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);

  const hints = question.hints || [];
  const hasMoreHints = hintsShown < hints.length;
  const isOwner = question.createdBy?._id === currentUserId;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-start gap-4 p-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={expanded}
        >
          <div className="flex flex-wrap items-center gap-2">
            {moduleBadge && (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                {moduleBadge}
              </span>
            )}
            <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{question.title}</p>
            <DifficultyBadge difficulty={question.difficulty} />
            {!readOnly && question.source === 'user' && (
              <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-faint)]">
                {isOwner ? 'Created by you' : 'User question'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{question.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {question.topicId?.name && <span className="text-[var(--color-text-faint)]">{question.topicId.name}</span>}
            {!readOnly && (
              <span className="flex items-center gap-1 font-mono text-[var(--color-text-faint)]">
                <Clock size={12} aria-hidden="true" />
                {question.expectedTime}m
              </span>
            )}
            <span className={cn('flex items-center gap-1 font-medium', STATUS_COLORS[status])}>
              <CircleCheck size={12} aria-hidden="true" />
              {readOnly ? 'Question completed' : STATUS_LABELS[status]}
            </span>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {!readOnly && isOwner && (
            <button
              type="button"
              onClick={() => onRequestDelete(question)}
              className="rounded-lg p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
              aria-label={`Delete ${question.title}`}
              title="Delete question"
            >
              <Trash2 size={15} />
            </button>
          )}
          <ChevronDown
            size={18}
            onClick={() => setExpanded((v) => !v)}
            className={cn('cursor-pointer text-[var(--color-text-faint)] transition-transform', expanded && 'rotate-180')}
            aria-hidden="true"
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-border)] p-4">
          {!readOnly && (
            <div className="mb-4 flex flex-wrap gap-2">
              {status !== 'in_progress' && (
                <Button variant="secondary" size="sm" onClick={() => onSetStatus(question._id, 'in_progress')}>
                  Mark attempted
                </Button>
              )}
              {status !== 'completed' && (
                <Button size="sm" onClick={() => onSetStatus(question._id, 'completed')}>
                  Mark completed
                </Button>
              )}
              {status !== 'not_started' && (
                <Button variant="ghost" size="sm" onClick={() => onSetStatus(question._id, 'not_started')}>
                  Reset status
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => onOpenNote(question)}>
                {hasNote ? <FileText size={14} aria-hidden="true" /> : <FilePlus size={14} aria-hidden="true" />}
                {hasNote ? 'View note' : 'Add note'}
              </Button>
            </div>
          )}

          {question.tags?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {hintsShown > 0 && (
            <ol className="mb-3 flex flex-col gap-2">
              {hints.slice(0, hintsShown).map((hint, i) => (
                <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-mono text-[var(--color-text-faint)]">{i + 1}.</span>
                  {hint}
                </li>
              ))}
            </ol>
          )}

          <div className="flex flex-wrap gap-2">
            {hasMoreHints && (
              <Button variant="secondary" size="sm" onClick={() => setHintsShown((n) => n + 1)}>
                <Lightbulb size={14} aria-hidden="true" />
                {hintsShown === 0 ? 'Show a hint' : 'Show another hint'}
              </Button>
            )}
            {!solutionShown && question.solutionNotes && (
              <Button variant="ghost" size="sm" onClick={() => setSolutionShown(true)}>
                <Eye size={14} aria-hidden="true" />
                Show approach
              </Button>
            )}
          </div>

          {solutionShown && (
            <div className="mt-3 rounded-lg bg-[var(--color-surface-2)] p-3">
              <p className="mb-1 text-xs font-medium text-[var(--color-text-faint)]">Approach</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{question.solutionNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
