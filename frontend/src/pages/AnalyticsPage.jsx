import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layers, ListChecks, Trophy, Flame, Clock, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { fetchAnalytics } from '../features/analytics/analyticsSlice';
import { ROUTES } from '../app/constants';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Skeleton from '../components/ui/Skeleton';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };
const CHART_COLORS = { lld: 'var(--color-accent)', hld: 'var(--color-info)' };

const formatMinutes = (mins) => {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

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

function ProgressBar({ percentage, color = 'var(--color-accent)' }) {
  if (percentage == null) {
    return <p className="text-sm text-[var(--color-text-faint)]">Not started</p>;
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
    </div>
  );
}

function SectionEmpty({ message }) {
  return <p className="py-6 text-center text-sm text-[var(--color-text-faint)]">{message}</p>;
}

// GitHub-style activity grid — a simple CSS grid, not a chart-library
// heatmap (Recharts has no native one), built from the day-key -> count map
// the backend already returns.
function ActivityHeatmap({ activityByDay, rangeDays }) {
  const days = [];
  const today = new Date();
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    days.push({ key, count: activityByDay[key] || 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const intensity = (count) => {
    if (count === 0) return 'var(--color-surface-2)';
    const ratio = count / max;
    if (ratio > 0.66) return 'var(--color-accent)';
    if (ratio > 0.33) return 'var(--color-accent-hover)';
    return 'var(--color-accent-soft)';
  };
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <div
          key={d.key}
          title={`${d.key}: ${d.count} activit${d.count === 1 ? 'y' : 'ies'}`}
          className="h-3.5 w-3.5 rounded-sm"
          style={{ backgroundColor: intensity(d.count) }}
        />
      ))}
    </div>
  );
}

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, all: 90 };

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { data, status } = useSelector((s) => s.analytics);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('30d');

  useEffect(() => {
    dispatch(fetchAnalytics({ module: moduleFilter, range: rangeFilter }));
  }, [dispatch, moduleFilter, rangeFilter]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (status === 'failed' || !data) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Couldn't load analytics. Try refreshing.</p>;
  }

  const { overview, moduleComparison, topicProgress, questionProgress, difficultyProgress, mockStats, mockActivity, preparationActivity, studyTime, roadmapProgress, weakAreas, strongAreas, recentActivity } = data;

  const statusChartData = [
    { name: 'Topics', Completed: topicProgress.status.completed, 'In progress': topicProgress.status.in_progress, 'Not started': topicProgress.status.not_started },
    { name: 'Questions', Completed: questionProgress.status.completed, 'In progress': questionProgress.status.in_progress, 'Not started': questionProgress.status.not_started },
  ];

  const difficultyChartData = ['Easy', 'Medium', 'Hard'].map((d) => ({
    name: d,
    'Topics completed': difficultyProgress.topics[d]?.completed || 0,
    'Topics remaining': (difficultyProgress.topics[d]?.total || 0) - (difficultyProgress.topics[d]?.completed || 0),
    'Questions completed': difficultyProgress.questions[d]?.completed || 0,
    'Questions remaining': (difficultyProgress.questions[d]?.total || 0) - (difficultyProgress.questions[d]?.completed || 0),
  }));

  const mockActivityEntries = Object.entries(mockActivity).sort(([a], [b]) => a.localeCompare(b));
  const mockActivityChartData = mockActivityEntries.map(([date, count]) => ({ date: date.slice(5), count }));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Analytics</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">Your real preparation data, computed from MongoDB.</p>
        </div>
        <div className="flex gap-2">
          <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="all">All modules</option>
            <option value="lld">LLD</option>
            <option value="hld">HLD</option>
          </Select>
          <Select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
            <option value="all">All time</option>
          </Select>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Layers} label="Topics" value={`${overview.topics.completed}/${overview.topics.total}`} sublabel={overview.topics.percentage == null ? 'Not started' : `${overview.topics.percentage}%`} />
        <StatCard icon={ListChecks} label="Questions" value={`${overview.questions.completed}/${overview.questions.total}`} sublabel={overview.questions.percentage == null ? 'Not started' : `${overview.questions.percentage}%`} />
        <StatCard icon={Trophy} label="Overall prep" value={overview.overallPreparation == null ? '—' : `${overview.overallPreparation}%`} />
        <StatCard icon={Flame} label="Current streak" value={`${overview.streak.currentStreak}d`} sublabel={`Best: ${overview.streak.longestStreak}d`} />
      </div>

      {/* LLD vs HLD */}
      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">LLD vs HLD</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {['lld', 'hld'].map((mod) => {
            const m = moduleComparison[mod];
            return (
              <div key={mod}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#16181D] dark:text-[#E9EAEC]">{MODULE_LABELS[mod]}</span>
                  <span className="text-[var(--color-text-faint)]">{m?.percentage == null ? 'Not started' : `${m.percentage}%`}</span>
                </div>
                <ProgressBar percentage={m?.percentage} color={CHART_COLORS[mod]} />
                <p className="mt-1.5 text-xs text-[var(--color-text-faint)]">
                  {m?.completedTopics || 0}/{m?.topics || 0} topics · {m?.completedQuestions || 0}/{m?.questions || 0} questions
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Topic/Question completion status */}
      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Completion status</h3>
        {topicProgress.total === 0 && questionProgress.total === 0 ? (
          <SectionEmpty message="No topics or questions to show yet." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusChartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-text-faint)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--color-text-faint)" fontSize={12} width={70} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Completed" stackId="a" fill="var(--color-success)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="In progress" stackId="a" fill="var(--color-warning)" />
              <Bar dataKey="Not started" stackId="a" fill="var(--color-surface-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Difficulty breakdown */}
      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Progress by difficulty</h3>
        {difficultyChartData.every((d) => d['Topics completed'] + d['Topics remaining'] + d['Questions completed'] + d['Questions remaining'] === 0) ? (
          <SectionEmpty message="No difficulty data yet." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={difficultyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-text-faint)" fontSize={12} />
              <YAxis stroke="var(--color-text-faint)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Topics completed" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Questions completed" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Mock interview stats */}
      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock interviews</h3>
        {mockStats.total === 0 ? (
          <SectionEmpty message="No mock interview data yet. Complete your first mock to start tracking this." />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-mono text-lg font-semibold text-[var(--color-success)]">{mockStats.byStatus.completed}</p>
                <p className="text-xs text-[var(--color-text-faint)]">Completed</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-[var(--color-accent)]">{mockStats.byStatus.in_progress}</p>
                <p className="text-xs text-[var(--color-text-faint)]">In progress</p>
              </div>
              <div>
                <p className="font-mono text-lg font-semibold text-[var(--color-text-faint)]">{mockStats.byStatus.abandoned}</p>
                <p className="text-xs text-[var(--color-text-faint)]">Abandoned</p>
              </div>
            </div>
            <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-faint)]">
              {mockStats.byType.topic} topic · {mockStats.byType.question} question · Scoring not available
            </p>
          </>
        )}
      </Card>

      {/* Mock activity */}
      <Card className="mt-4 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock interview activity</h3>
        {mockActivityChartData.length === 0 ? (
          <SectionEmpty message="No mock interviews yet. Complete your first mock interview to see your activity here." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockActivityChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--color-text-faint)" fontSize={11} />
              <YAxis stroke="var(--color-text-faint)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Preparation activity heatmap */}
      <Card className="mt-4 p-5">
        <h3 className="mb-1 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Preparation activity</h3>
        {Object.keys(preparationActivity).length === 0 ? (
          <SectionEmpty message="No preparation activity yet." />
        ) : (
          <>
            <p className="mb-3 text-xs text-[var(--color-text-faint)]">Topics, questions, and roadmap days completed per day.</p>
            <ActivityHeatmap activityByDay={preparationActivity} rangeDays={RANGE_DAYS[rangeFilter]} />
          </>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Study time */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            <Clock size={15} aria-hidden="true" />
            Study time
          </h3>
          {studyTime.totalMinutes === 0 ? (
            <SectionEmpty message="No study time recorded yet." />
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Total</span>
                <span className="font-mono font-semibold text-[#16181D] dark:text-[#E9EAEC]">{formatMinutes(studyTime.totalMinutes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Topics</span>
                <span className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{formatMinutes(studyTime.topicMinutes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Questions</span>
                <span className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{formatMinutes(studyTime.questionMinutes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-secondary)]">Mock interviews</span>
                <span className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{formatMinutes(studyTime.mockMinutes)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Roadmap progress */}
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Roadmap progress</h3>
          {!roadmapProgress ? (
            <SectionEmpty message="No roadmap available for this module." />
          ) : (
            <>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-[#16181D] dark:text-[#E9EAEC]">{roadmapProgress.title}</span>
                <span className="text-[var(--color-text-faint)]">{roadmapProgress.percentage == null ? 'Not started' : `${roadmapProgress.percentage}%`}</span>
              </div>
              <ProgressBar percentage={roadmapProgress.percentage} />
              <p className="mt-1.5 text-xs text-[var(--color-text-faint)]">
                {roadmapProgress.completedStudyDays}/{roadmapProgress.totalStudyDays} study days
              </p>
              {roadmapProgress.currentDay && (
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  Current: Day {roadmapProgress.currentDay.dayNumber} — {roadmapProgress.currentDay.title}
                </p>
              )}
              {roadmapProgress.weekly.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-[var(--color-border)] pt-3">
                  {roadmapProgress.weekly.map((w) => (
                    <div key={w.weekNumber} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0 text-[var(--color-text-faint)]">Week {w.weekNumber}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${w.percentage || 0}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[var(--color-text-faint)]">{w.percentage == null ? '\u2014' : `${w.percentage}%`}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Weak areas */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            <TrendingDown size={15} aria-hidden="true" />
            Weak areas
          </h3>
          {weakAreas.length === 0 ? (
            <SectionEmpty message="No confidence data yet. Rate your confidence on a topic or question to see this." />
          ) : (
            <div className="flex flex-col gap-2">
              {weakAreas.map((a) => (
                <div key={`${a.targetType}-${a.targetId}`} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-[#16181D] dark:text-[#E9EAEC]">{a.name}</p>
                    <p className="text-xs text-[var(--color-text-faint)]">Confidence: {a.confidence}/5</p>
                  </div>
                  <Link to={a.targetType === 'question' ? ROUTES.QUESTIONS : ROUTES.TOPICS} className="text-xs font-medium text-[var(--color-accent)]">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Strong areas */}
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            <TrendingUp size={15} aria-hidden="true" />
            Strong areas
          </h3>
          {strongAreas.length === 0 ? (
            <SectionEmpty message="No confidence data yet." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {strongAreas.map((a) => (
                <p key={`${a.targetType}-${a.targetId}`} className="text-sm text-[#16181D] dark:text-[#E9EAEC]">
                  {a.name}
                </p>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-4 p-5">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
          <Activity size={15} aria-hidden="true" />
          Recent activity
        </h3>
        {recentActivity.length === 0 ? (
          <SectionEmpty message="No activity yet." />
        ) : (
          <div className="flex flex-col gap-1">
            {recentActivity.map((item) => (
              <div key={`${item.targetType}-${item.targetId}`} className="flex items-center justify-between py-1 text-sm">
                <span className="text-[#16181D] dark:text-[#E9EAEC]">
                  {item.status === 'completed' ? 'Completed' : 'Started'} <span className="text-[var(--color-text-secondary)]">{item.name}</span>
                </span>
                <span className="text-xs text-[var(--color-text-faint)]">{new Date(item.updatedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
