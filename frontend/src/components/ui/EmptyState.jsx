import { cn } from '../../utils/cn';

// A consistent, "invitation to act" empty state per the product's UX rules —
// every empty screen explains what's missing and gives a next step.
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-strong)] px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
          <Icon size={22} className="text-[var(--color-text-faint)]" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
