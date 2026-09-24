import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Map, Code2, Mic, Flame, LineChart, Network } from 'lucide-react';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import DashboardPreviewCard from '../components/dashboard/DashboardPreviewCard';
import { ROUTES } from '../app/constants';

const FEATURES = [
  {
    icon: Map,
    title: 'Track your roadmap',
    description:
      'A day-by-day plan across object-oriented design, SOLID, and every major pattern, so you always know what\u2019s next, not just what\u2019s left.',
  },
  {
    icon: Code2,
    title: 'Practice LLD',
    description:
      'Work through real machine-coding problems \u2014 parking lot, Splitwise, chess \u2014 with hints and solution notes when you\u2019re stuck, not before.',
  },
  {
    icon: Mic,
    title: 'Mock interviews',
    description:
      'Timed sessions with the same pressure as the real thing. Design under a clock, then see exactly where you lost points.',
  },
  {
    icon: Flame,
    title: 'Gamification',
    description:
      'XP, streaks, and levels that track effort you can actually see \u2014 not decoration, just a running record of the work.',
  },
  {
    icon: LineChart,
    title: 'Analytics',
    description:
      'Every mock and every topic feeds one picture: what\u2019s strong, what\u2019s weak, and what to revise next.',
  },
  {
    icon: Network,
    title: 'Future HLD support',
    description:
      'The same system will carry system design prep \u2014 scalability, caching, distributed systems \u2014 once your LLD foundation is solid.',
    badge: 'Coming soon',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-base)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[#16181D] dark:hover:text-[#E9EAEC]"
          >
            Log in
          </Link>
          <Link to={ROUTES.REGISTER}>
            <Button size="sm">Start preparing</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:grid-cols-2 md:items-center md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <p className="mb-4 text-sm font-medium text-[var(--color-accent)]">
            Learn. Practice. Mock. Improve.
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-[#16181D] dark:text-[#E9EAEC] sm:text-5xl">
            Turn interview preparation into a system.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-secondary)]">
            Track your preparation, practice real interview problems, run timed mocks, and
            build the confidence to design systems under pressure.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={ROUTES.REGISTER}>
              <Button size="lg">Start preparing</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">
                View demo
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
        >
          <DashboardPreviewCard />
        </motion.div>
      </section>

      <section id="features" className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="max-w-lg text-2xl font-semibold tracking-tight text-[#16181D] dark:text-[#E9EAEC]">
            Everything you need to prepare on purpose, not on hope.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, badge }) => (
              <div
                key={title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-base)] p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent-soft)]">
                    <Icon size={18} className="text-[var(--color-accent)]" aria-hidden="true" />
                  </div>
                  {badge && (
                    <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-text-faint)]">
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[#16181D] dark:text-[#E9EAEC]">
          Your streak starts the day you sign up.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--color-text-secondary)]">
          Free to start. No credit card. Just your roadmap, waiting.
        </p>
        <Link to={ROUTES.REGISTER} className="mt-7 inline-block">
          <Button size="lg">Start preparing</Button>
        </Link>
      </section>

      <footer className="border-t border-[var(--color-border)] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <Logo size="sm" />
          <p className="text-xs text-[var(--color-text-faint)]">
            &copy; {new Date().getFullYear()} InterviewForge. Built for systematic interview prep.
          </p>
        </div>
      </footer>
    </div>
  );
}
