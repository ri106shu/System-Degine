import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Footprints,
  Compass,
  Layers,
  GraduationCap,
  ListChecks,
  Puzzle,
  Hammer,
  Mic,
  Swords,
  Crown,
  Map,
  FlagTriangleRight,
  Flame,
  Blocks,
  Castle,
  Network,
  Server,
  Lock,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { fetchAchievements } from '../features/achievements/achievementsSlice';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

// Maps the catalog's icon name (a plain string from the backend, kept
// framework-agnostic there) to an actual Lucide component here.
const ICONS = {
  Footprints,
  Compass,
  Layers,
  GraduationCap,
  ListChecks,
  Puzzle,
  Hammer,
  Mic,
  Swords,
  Crown,
  Map,
  FlagTriangleRight,
  Flame,
  Blocks,
  Castle,
  Network,
  Server,
};

const CATEGORY_LABELS = {
  all: 'All',
  topics: 'Topics',
  questions: 'Questions',
  mocks: 'Mock Interviews',
  roadmap: 'Roadmap',
  streaks: 'Streaks',
  lld: 'LLD',
  hld: 'HLD',
};
const CATEGORIES = ['all', 'topics', 'questions', 'mocks', 'roadmap', 'streaks', 'lld', 'hld'];

const relativeTime = (isoString) => {
  const date = new Date(isoString);
  const diffHours = Math.floor((Date.now() - date) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

function AchievementCard({ achievement }) {
  const Icon = ICONS[achievement.icon] || Trophy;
  return (
    <Card className={`p-4 ${achievement.earned ? 'border-[var(--color-accent)]/30' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-lg p-2 ${achievement.earned ? 'bg-[var(--color-accent-soft)]' : 'bg-[var(--color-surface-2)]'}`}>
          <Icon size={20} className={achievement.earned ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-faint)]'} aria-hidden="true" />
        </div>
        {achievement.earned ? (
          <CheckCircle2 size={16} className="text-[var(--color-success)]" aria-hidden="true" />
        ) : (
          <Lock size={14} className="text-[var(--color-text-faint)]" aria-hidden="true" />
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{achievement.name}</p>
      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{achievement.description}</p>
      {achievement.earned ? (
        <p className="mt-2 text-xs font-medium text-[var(--color-success)]">
          Earned {new Date(achievement.earnedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      ) : (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-[var(--color-text-faint)]">
            <span>
              {achievement.progress} / {achievement.target}
            </span>
            <span>{Math.round((achievement.progress / achievement.target) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${Math.min(100, Math.round((achievement.progress / achievement.target) * 100))}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const { achievements, stats, status } = useSelector((s) => s.achievements);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    dispatch(fetchAchievements());
  }, [dispatch]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
    );
  }

  if (status === 'failed') {
    return <p className="text-sm text-[var(--color-text-secondary)]">Couldn't load achievements. Try refreshing.</p>;
  }

  const filtered = category === 'all' ? achievements : achievements.filter((a) => a.category === category);
  const recentlyEarned = stats?.recentAchievements || [];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Achievements</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">Badges earned from your real preparation activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-text-faint)]">Earned</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            {stats?.earnedCount ?? 0} / {stats?.totalCount ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-text-faint)]">Completion</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats?.completionPercentage ?? 0}%</p>
        </Card>
      </div>

      {stats?.earnedCount === 0 ? (
        <div className="mt-5">
          <EmptyState icon={Trophy} title="No achievements earned yet" description="Complete your first topic to unlock your first badge." />
        </div>
      ) : (
        recentlyEarned.length > 0 && (
          <Card className="mt-4 p-5">
            <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Recently earned</h3>
            <div className="flex flex-col gap-2">
              {recentlyEarned.map((a) => {
                const Icon = ICONS[a.icon] || Trophy;
                return (
                  <div key={a.key} className="flex items-center gap-2.5 text-sm">
                    <Icon size={15} className="text-[var(--color-accent)]" aria-hidden="true" />
                    <span className="flex-1 text-[#16181D] dark:text-[#E9EAEC]">{a.name}</span>
                    <span className="text-xs text-[var(--color-text-faint)]">{relativeTime(a.earnedAt)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              category === c
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[#16181D] dark:hover:text-[#E9EAEC]'
            }`}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <AchievementCard key={a.key} achievement={a} />
        ))}
      </div>
    </div>
  );
}
