import { cn } from '../../utils/cn';

export default function CoverageCard({ icon: Icon, label, completed, total, percentage }) {
  const hasContent = total > 0;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
        <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">{label}</p>
      </div>

      {hasContent ? (
        <>
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            {completed} / {total} <span className="text-sm font-normal text-[var(--color-text-faint)]">completed</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-text-faint)]">{percentage}% · {total} total</p>
        </>
      ) : (
        <p className={cn('text-sm text-[var(--color-text-faint)]')}>Not started — no content yet</p>
      )}
    </div>
  );
}
