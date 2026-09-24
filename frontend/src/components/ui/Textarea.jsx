import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

const Textarea = forwardRef(({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        className={cn(
          'w-full resize-y rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-[#16181D] dark:text-[#E9EAEC]',
          'placeholder:text-[var(--color-text-faint)] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${textareaId}-hint`} className="mt-1.5 text-xs text-[var(--color-text-faint)]">
          {hint}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
