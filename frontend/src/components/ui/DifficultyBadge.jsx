import { cn } from '../../utils/cn';

const STYLES = {
  Easy: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  Medium: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  Hard: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

export default function DifficultyBadge({ difficulty, className }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        STYLES[difficulty] || 'bg-[var(--color-surface-2)] text-[var(--color-text-faint)]',
        className
      )}
    >
      {difficulty}
    </span>
  );
}
