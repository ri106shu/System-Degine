import { clsx } from 'clsx';

// Small conditional-classnames helper, used throughout components/ui so
// variants (e.g. Button's "primary" vs "danger") stay readable.
export function cn(...inputs) {
  return clsx(...inputs);
}
