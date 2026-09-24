import { Outlet, Link } from 'react-router';
import Logo from '../ui/Logo';
import { ROUTES } from '../../app/constants';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-base)]">
      <header className="px-6 py-5">
        <Link to={ROUTES.HOME}>
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
