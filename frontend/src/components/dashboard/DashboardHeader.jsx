import { Flame, Star, Trophy, Clock } from 'lucide-react';

const formatStudyTime = (minutes) => {
  if (!minutes) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardHeader({ user }) {
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
        {greeting()}, {firstName} 👋
      </h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Track your preparation, complete your weak areas, and test yourself with mock interviews.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Flame size={16} className="mb-2 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            {user?.currentStreak ?? 0}
          </p>
          <p className="text-xs text-[var(--color-text-faint)]">day streak</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Star size={16} className="mb-2 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{user?.xp ?? 0}</p>
          <p className="text-xs text-[var(--color-text-faint)]">total XP</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Trophy size={16} className="mb-2 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{user?.level ?? 1}</p>
          <p className="text-xs text-[var(--color-text-faint)]">current level</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <Clock size={16} className="mb-2 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            {formatStudyTime(user?.totalStudyMinutes)}
          </p>
          <p className="text-xs text-[var(--color-text-faint)]">study time</p>
        </div>
      </div>
    </div>
  );
}
