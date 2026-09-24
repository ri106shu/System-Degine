import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

// forwardRef so this plugs straight into react-hook-form's register().
// type="password" gets a built-in show/hide toggle automatically — every
// password field in the app (register, login, confirm password, any future
// one) gets this the same way, from one place, rather than each page
// re-implementing its own eye icon. Each input's visibility is its own
// local state, so toggling "Password" never affects "Confirm password".
const Input = forwardRef(({ label, error, hint, className, id, type, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={isPassword ? (visible ? 'text' : 'password') : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            'h-10 w-full rounded-lg border bg-[var(--color-surface)] px-3 text-sm text-[#16181D] dark:text-[#E9EAEC]',
            'placeholder:text-[var(--color-text-faint)] transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)]',
            error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
            isPassword && 'pr-10',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--color-text-faint)] hover:text-[var(--color-text-secondary)]"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--color-text-faint)]">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
