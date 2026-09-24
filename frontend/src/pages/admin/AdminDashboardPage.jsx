import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { Layers, ListChecks, MessageCircleQuestion, Map, Mic, Clock3 } from 'lucide-react';
import { fetchAdminDashboard } from '../../features/admin/adminSlice';
import { ROUTES } from '../../app/constants';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };

function ContentCard({ icon: Icon, label, module, value, manageTo }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--color-text-faint)]">
          <Icon size={15} aria-hidden="true" />
          <p className="text-xs font-medium">{label}</p>
        </div>
        <span className="rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
          {MODULE_LABELS[module]}
        </span>
      </div>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{value}</p>
      <Link to={manageTo} className="mt-2 inline-block text-xs font-medium text-[var(--color-accent)]">
        Manage {label.toLowerCase()} →
      </Link>
    </Card>
  );
}

function ActivityList({ title, items, emptyText }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-text-faint)]">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span className="truncate text-[#16181D] dark:text-[#E9EAEC]">{item.label}</span>
              <span className="ml-2 shrink-0 text-xs text-[var(--color-text-faint)]">{MODULE_LABELS[item.module]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { dashboard, dashboardStatus } = useSelector((s) => s.admin);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (dashboardStatus === 'loading' || dashboardStatus === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (dashboardStatus === 'failed' || !dashboard) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Couldn't load admin statistics. Try refreshing.</p>;
  }

  const { content, mocks, activity } = dashboard;

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">InterviewForge Administration</h2>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">Manage interview content, roadmaps and platform activity.</p>

      <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Content overview</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <ContentCard icon={Layers} label="Topics" module="lld" value={content.lld.topics} manageTo={ROUTES.ADMIN_TOPICS} />
        <ContentCard icon={Layers} label="Topics" module="hld" value={content.hld.topics} manageTo={ROUTES.ADMIN_TOPICS} />
        <ContentCard icon={ListChecks} label="Questions" module="lld" value={content.lld.questions} manageTo={ROUTES.ADMIN_QUESTIONS} />
        <ContentCard icon={ListChecks} label="Questions" module="hld" value={content.hld.questions} manageTo={ROUTES.ADMIN_QUESTIONS} />
        <ContentCard icon={MessageCircleQuestion} label="Prompts" module="lld" value={content.lld.prompts} manageTo={ROUTES.ADMIN_PROMPTS} />
        <ContentCard icon={MessageCircleQuestion} label="Prompts" module="hld" value={content.hld.prompts} manageTo={ROUTES.ADMIN_PROMPTS} />
        <ContentCard icon={Map} label="Roadmaps" module="lld" value={content.lld.roadmaps} manageTo={ROUTES.ADMIN_ROADMAP_LLD} />
        <ContentCard icon={Map} label="Roadmaps" module="hld" value={content.hld.roadmaps} manageTo={ROUTES.ADMIN_ROADMAP_HLD} />
      </div>

      <h3 className="mb-3 mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
        <Mic size={15} aria-hidden="true" />
        Mock interview activity
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-text-faint)]">Completed</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[var(--color-success)]">{mocks.completed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-text-faint)]">In progress</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[var(--color-accent)]">{mocks.inProgress}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-[var(--color-text-faint)]">Abandoned</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[var(--color-text-faint)]">{mocks.abandoned}</p>
        </Card>
      </div>

      <h3 className="mb-3 mt-6 flex items-center gap-1.5 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
        <Clock3 size={15} aria-hidden="true" />
        Content activity
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <ActivityList title="Recently added topics" items={activity.topics.recentlyAdded} emptyText="No topics yet." />
            <ActivityList title="Recently updated topics" items={activity.topics.recentlyUpdated} emptyText="No recent edits." />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <ActivityList title="Recently added questions" items={activity.questions.recentlyAdded} emptyText="No questions yet." />
            <ActivityList title="Recently updated questions" items={activity.questions.recentlyUpdated} emptyText="No recent edits." />
          </div>
        </Card>
      </div>
    </div>
  );
}
