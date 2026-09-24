import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

const Select = forwardRef(({ label, error, hint, className, id, children, ...props }, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        className={cn(
          'h-10 w-full rounded-lg border bg-[var(--color-surface)] px-3 text-sm text-[#16181D] dark:text-[#E9EAEC]',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-[var(--color-text-faint)]">
          {hint}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
