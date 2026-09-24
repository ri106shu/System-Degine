import { useState } from 'react';
import { ChevronDown, MessageCircleQuestion, CircleCheck } from 'lucide-react';
import DifficultyBadge from '../ui/DifficultyBadge';

export default function TopicPromptCard({ topic, moduleBadge }) {
  const [expanded, setExpanded] = useState(false);
  const followUps = topic.followUps || [];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-4 p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {moduleBadge && (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                {moduleBadge}
              </span>
            )}
            <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{topic.name}</p>
            <DifficultyBadge difficulty={topic.difficulty} />
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{topic.prompt}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            {topic.category && <span className="text-[var(--color-text-faint)]">{topic.category}</span>}
            <span className="flex items-center gap-1 font-medium text-[var(--color-success)]">
              <CircleCheck size={12} aria-hidden="true" />
              Topic completed
            </span>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[var(--color-text-faint)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {expanded && followUps.length > 0 && (
        <div className="border-t border-[var(--color-border)] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-faint)]">
            <MessageCircleQuestion size={13} aria-hidden="true" />
            Possible follow-ups
          </p>
          <ul className="flex flex-col gap-1.5">
            {followUps.map((f, i) => (
              <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
