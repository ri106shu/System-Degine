import { cn } from '../../utils/cn';

// Generic on purpose: Topics/Questions use it for ['lld','hld'], Mock
// Interview will reuse it for ['lld','hld','mixed'] — one toggle, not one
// per page, per the brief's explicit "do not duplicate toggle code" note.
export default function ModuleToggle({ value, onChange, options, labels = {}, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-1',
        className
      )}
    >
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-4',
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-[0_1px_0_0_var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[#16181D] dark:hover:text-[#E9EAEC]'
            )}
          >
            {labels[option] || option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
