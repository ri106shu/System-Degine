import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Layers, ListChecks, MessageCircleQuestion, Map, Mic, BarChart3, Activity } from 'lucide-react';
import { fetchAdminAnalytics } from '../../features/adminAnalytics/adminAnalyticsSlice';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import DifficultyBadge from '../../components/ui/DifficultyBadge';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };

function SectionEmpty({ message }) {
  return <p className="py-6 text-center text-sm text-[var(--color-text-faint)]">{message}</p>;
}

function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[var(--color-text-faint)]">
        <Icon size={15} aria-hidden="true" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">{sublabel}</p>}
    </Card>
  );
}

function RankedTable({ title, rows, valueLabel }) {
  return (
    <Card className="p-5">
      <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{title}</h3>
      {rows.length === 0 ? (
        <SectionEmpty message="No activity yet." />
      ) : (
        <ol className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--color-text-faint)]">{i + 1}.</span>
                  <p className="truncate text-sm text-[#16181D] dark:text-[#E9EAEC]">{r.title || r.name}</p>
                  {r.difficulty && <DifficultyBadge difficulty={r.difficulty} />}
                </div>
                <p className="ml-5 truncate text-xs text-[var(--color-text-faint)]">
                  {MODULE_LABELS[r.module]}
                  {r.topic ? ` · ${r.topic}` : ''}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">
                {r.count ?? r.activities} {valueLabel}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const dispatch = useDispatch();
  const { data, status } = useSelector((s) => s.adminAnalytics);
  const range = data?.range || '30d';

  useEffect(() => {
    dispatch(fetchAdminAnalytics('30d'));
  }, [dispatch]);

  const loading = status === 'loading' || status === 'idle';

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (status === 'failed' || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Unable to load analytics.</p>
        <Button onClick={() => dispatch(fetchAdminAnalytics(range))}>Retry</Button>
      </div>
    );
  }

  const {
    overview,
    interviewActivity,
    dailyActivity,
    moduleComparison,
    mostAttemptedQuestions,
    mostCompletedQuestions,
    mostActiveTopics,
    difficultyDistribution,
    roadmapActivity,
    recentActivity,
  } = data;

  const chartData = dailyActivity.map((d) => ({
    day: new Date(d.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    Started: d.started,
    Completed: d.completed,
  }));

  const activityLabel = (type) => {
    switch (type) {
      case 'topic_completed':
        return 'completed a topic';
      case 'question_completed':
        return 'completed a question';
      case 'roadmap_completed':
        return 'completed a roadmap day';
      case 'mock_completed':
        return 'finished a mock interview';
      case 'mock_started':
        return 'started a mock interview';
      default:
        return 'was active';
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Analytics</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">Platform-wide interview preparation analytics.</p>
        </div>
        <Select label="Period" value={range} onChange={(e) => dispatch(fetchAdminAnalytics(e.target.value))}>
          <option value="today">Today</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
          <option value="all">All Time</option>
        </Select>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Content overview</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Layers} label="Total topics" value={overview.totalTopics} sublabel={`LLD ${overview.lldTopics} · HLD ${overview.hldTopics}`} />
        <StatCard
          icon={ListChecks}
          label="Total questions"
          value={overview.totalQuestions}
          sublabel={`LLD ${overview.lldQuestions} · HLD ${overview.hldQuestions}`}
        />
        <StatCard icon={MessageCircleQuestion} label="Topic prompts" value={overview.topicPrompts} />
        <StatCard
          icon={Map}
          label="Roadmaps"
          value={overview.lldRoadmaps + overview.hldRoadmaps}
          sublabel={`LLD ${overview.lldRoadmaps} · HLD ${overview.hldRoadmaps}`}
        />
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Interview activity</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Mic} label="Total" value={interviewActivity.total} />
        <StatCard icon={Mic} label="Completed" value={interviewActivity.completed} />
        <StatCard icon={Mic} label="In progress" value={interviewActivity.inProgress} />
        <StatCard icon={Mic} label="Abandoned" value={interviewActivity.abandoned} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-faint)]">
        LLD {interviewActivity.lld} · HLD {interviewActivity.hld} · Mixed {interviewActivity.mixed}
      </p>

      <Card className="mt-6 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Daily activity</h3>
        {chartData.length === 0 ? (
          <SectionEmpty message="No interview activity in this period." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--color-text-faint)" fontSize={11} />
              <YAxis stroke="var(--color-text-faint)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Started" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completed" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">LLD vs HLD</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {['lld', 'hld'].map((mod) => (
          <Card key={mod} className="p-5">
            <p className="mb-3 text-sm font-semibold text-[var(--color-accent)]">{MODULE_LABELS[mod]}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-[var(--color-text-faint)]">Topics</p>
                <p className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{moduleComparison[mod]?.topics ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-faint)]">Questions</p>
                <p className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{moduleComparison[mod]?.questions ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-faint)]">Mocks</p>
                <p className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{moduleComparison[mod]?.mocks ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-faint)]">Completed</p>
                <p className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{moduleComparison[mod]?.completed ?? 0}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RankedTable title="Most attempted questions" rows={mostAttemptedQuestions} valueLabel="attempts" />
        <RankedTable title="Most completed questions" rows={mostCompletedQuestions} valueLabel="completed" />
      </div>

      <div className="mt-4">
        <RankedTable title="Most active topics" rows={mostActiveTopics} valueLabel="activities" />
      </div>

      <Card className="mt-6 p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
          <BarChart3 size={15} aria-hidden="true" />
          Difficulty distribution
        </h3>
        {difficultyDistribution.total === 0 ? (
          <SectionEmpty message="No completed activity yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {['Easy', 'Medium', 'Hard'].map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-16 text-xs text-[var(--color-text-faint)]">{d}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${difficultyDistribution[d]}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-xs text-[#16181D] dark:text-[#E9EAEC]">{difficultyDistribution[d]}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Roadmap activity</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {['lld', 'hld'].map((mod) => (
          <Card key={mod} className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">{MODULE_LABELS[mod]}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {roadmapActivity[mod]?.studyDays ?? 0} study days · {roadmapActivity[mod]?.restDays ?? 0} rest days
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{roadmapActivity[mod]?.completedDayInstances ?? 0} day completions logged</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
          <Activity size={15} aria-hidden="true" />
          Recent activity
        </h3>
        {recentActivity.length === 0 ? (
          <SectionEmpty message="No interview activity yet." />
        ) : (
          <ul className="flex flex-col gap-2">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-[#16181D] dark:text-[#E9EAEC]">
                  {a.userName} {activityLabel(a.type)}
                  {a.module ? ` (${MODULE_LABELS[a.module]})` : ''}
                </span>
                <span className="shrink-0 text-xs text-[var(--color-text-faint)]">
                  {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
