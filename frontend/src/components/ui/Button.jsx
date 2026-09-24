import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const VARIANTS = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60',
  secondary:
    'bg-[var(--color-surface-2)] text-[#16181D] dark:text-[#E9EAEC] hover:bg-[var(--color-border)] border border-[var(--color-border)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[#16181D] dark:hover:text-[#E9EAEC]',
  danger:
    'bg-[var(--color-danger)] text-white hover:opacity-90 disabled:opacity-60',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors',
          'disabled:cursor-not-allowed',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
