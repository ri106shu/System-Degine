import { Link } from 'react-router';
import Button from '../components/ui/Button';
import { ROUTES } from '../app/constants';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-base)] px-4 text-center">
      <p className="font-mono text-sm text-[var(--color-accent)]">404</p>
      <h1 className="text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Page not found</h1>
      <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
        That page doesn't exist, or moved. Head back to the dashboard.
      </p>
      <Link to={ROUTES.HOME} className="mt-3">
        <Button>Back home</Button>
      </Link>
    </div>
  );
}
