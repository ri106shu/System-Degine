import { Flame } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Logo({ className, showWordmark = true, size = 'md' }) {
  const sizes = {
    sm: { icon: 16, text: 'text-sm' },
    md: { icon: 20, text: 'text-base' },
    lg: { icon: 28, text: 'text-xl' },
  };
  const s = sizes[size];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex items-center justify-center rounded-md bg-[var(--color-accent)] p-1.5">
        <Flame size={s.icon} className="text-white" strokeWidth={2.25} aria-hidden="true" />
      </span>
      {showWordmark && (
        <span className={cn('font-bold tracking-tight text-[#16181D] dark:text-[#E9EAEC]', s.text)}>
          InterviewForge
        </span>
      )}
    </div>
  );
}
