import { cn } from '../../utils/cn';

// One toggle for every boolean admin setting. A native <button> is used
// rather than a styled <input type="checkbox"> so Enter/Space activation
// and focus handling come from the browser for free, with role="switch"
// and aria-checked layered on top so screen readers announce it as a
// switch rather than a generic button. `checked` always reflects the
// caller's own state — this component holds no state of its own, so a
// destructive toggle's caller can withhold the checked flip until an API
// call actually succeeds, while a non-destructive one can flip it
// immediately and revert on failure. Either policy lives in the caller.
//
// Track: 64x36px. Thumb: 30x30px, positioned with left-[3px] as its base
// (never right/right-auto, so there's only ever one positioning axis in
// play) and moved with a single translateX: translate-x-0 at rest (off),
// translate-x-[28px] when checked (on) — 64 - 3 - 30 - 3 = 28, the exact
// remaining travel distance, so the thumb's right edge lands precisely
// 3px from the track's right edge, never outside it. One thumb element
// only; position is driven entirely by `checked`, never two separate
// on/off thumb nodes.
export default function Toggle({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-block h-9 w-16 shrink-0 rounded-full transition-colors duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-toggle-off)]'
      )}
    >
      <span
        className={cn(
          'absolute left-[3px] top-[3px] h-[30px] w-[30px] rounded-full bg-white shadow-sm transition-transform duration-150 ease-in-out',
          checked ? 'translate-x-[28px]' : 'translate-x-0'
        )}
      />
    </button>
  );
}

