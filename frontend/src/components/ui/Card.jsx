import { cn } from '../../utils/cn';

// Border-first, shadow-free by default — elevation is reserved for things
// that are genuinely floating (modals, dropdowns), not every card on a page.
export default function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
