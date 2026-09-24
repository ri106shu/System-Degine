import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { fetchDashboard } from '../features/dashboard/dashboardSlice';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { Star, Flame, Trophy, Clock, Mic, Award } from 'lucide-react';

const STAT_ITEMS = [
  { key: 'xp', label: 'XP', icon: Star, value: (u) => u.xp ?? 0 },
  { key: 'level', label: 'Level', icon: Trophy, value: (u) => u.level ?? 1 },
  { key: 'streak', label: 'Current streak', icon: Flame, value: (u) => `${u.currentStreak ?? 0}d` },
  { key: 'longest', label: 'Longest streak', icon: Award, value: (u) => `${u.longestStreak ?? 0}d` },
  { key: 'hours', label: 'Study hours', icon: Clock, value: (u) => Math.round((u.totalStudyMinutes ?? 0) / 60) },
  { key: 'mocks', label: 'Mocks completed', icon: Mic, value: () => 0 },
];

function ModuleProgressRow({ label, section }) {
  const hasContent = section.topics.total > 0 || section.questions.total > 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">{label}</p>
        <p className="text-xs text-[var(--color-text-faint)]">
          {hasContent
            ? `${section.topics.completed + section.questions.completed} / ${section.topics.total + section.questions.total} completed`
            : 'No content yet'}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)]"
          style={{
            width: hasContent
              ? `${Math.round(((section.topics.completed + section.questions.completed) / (section.topics.total + section.questions.total)) * 100)}%`
              : '0%',
          }}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { data, status } = useSelector((state) => state.dashboard);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchDashboard());
  }, [status, dispatch]);

  if (!user) return null;

  const initial = user.name?.trim()?.[0]?.toUpperCase() || '?';
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Profile</h2>

      <Card className="flex items-center gap-4 p-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xl font-semibold text-[var(--color-accent)]">
          {initial}
        </span>
        <div>
          <p className="text-base font-semibold text-[#16181D] dark:text-[#E9EAEC]">{user.name}</p>
          <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
          {joined && (
            <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">Member since {joined}</p>
          )}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STAT_ITEMS.map(({ key, label, icon: Icon, value }) => (
          <Card key={key} className="p-4">
            <Icon size={16} className="mb-2 text-[var(--color-accent)]" aria-hidden="true" />
            <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">
              {value(user)}
            </p>
            <p className="text-xs text-[var(--color-text-faint)]">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 p-5">
        <p className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Module progress</p>
        {status === 'loading' || status === 'idle' ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4">
            <ModuleProgressRow label="LLD" section={data.lld} />
            <ModuleProgressRow label="HLD" section={data.hld} />
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">Couldn't load progress right now.</p>
        )}
      </Card>
    </div>
  );
}
