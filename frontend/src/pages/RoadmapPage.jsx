import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Map, Target, ArrowRight } from 'lucide-react';
import { fetchRoadmaps, fetchRoadmapDetail, setRoadmapDayStatus } from '../features/roadmap/roadmapSlice';
import ModuleToggle from '../components/ui/ModuleToggle';
import RoadmapDayCard from '../components/roadmap/RoadmapDayCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { cn } from '../utils/cn';

function ProgressBar({ percentage }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
      <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${percentage ?? 0}%` }} />
    </div>
  );
}

function WeekSection({ week, isExpandedByDefault, currentDayId, onSetStatus, updatingDayId }) {
  const [expanded, setExpanded] = useState(isExpandedByDefault);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            Week {week.weekNumber} · {week.title}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
            {week.totalStudyDays > 0
              ? `${week.completedStudyDays} / ${week.totalStudyDays} completed \u00b7 ${week.percentage}%`
              : 'No study days yet'}
          </p>
          <div className="mt-2">
            <ProgressBar percentage={week.percentage} />
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-[var(--color-text-faint)] transition-transform', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] p-4">
          {week.days.map((day) => (
            <RoadmapDayCard
              key={day._id}
              day={day}
              isCurrent={day._id === currentDayId}
              updating={updatingDayId === day._id}
              onSetStatus={onSetStatus}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function RoadmapDetail({ roadmapId }) {
  const dispatch = useDispatch();
  const { detail, detailStatus } = useSelector((s) => s.roadmap);
  const [updatingDayId, setUpdatingDayId] = useState(null);

  useEffect(() => {
    dispatch(fetchRoadmapDetail(roadmapId));
  }, [dispatch, roadmapId]);

  const handleSetStatus = async (dayId, status) => {
    setUpdatingDayId(dayId);
    await dispatch(setRoadmapDayStatus({ dayId, status }));
    setUpdatingDayId(null);
  };

  if (detailStatus === 'loading' || detailStatus === 'idle' || !detail) {
    return (
      <div className="mt-5 flex flex-col gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { roadmap, weeks, stats, currentDay, nextUp } = detail;
  const currentWeekId = currentDay ? weeks.find((w) => w.days.some((d) => d._id === currentDay._id))?._id : null;

  return (
    <div className="mt-5 flex flex-col gap-5">
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{roadmap.title}</h3>
        {roadmap.description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{roadmap.description}</p>}
        <p className="mt-2 text-xs text-[var(--color-text-faint)]">
          {roadmap.totalWeeks} Weeks · {stats.totalStudyDays + stats.totalRestDays}-Day Plan · 2–3 hrs/day
        </p>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Progress</p>
          <p className="font-mono text-sm text-[var(--color-text-secondary)]">
            {stats.completed} / {stats.totalStudyDays} study days
          </p>
        </div>
        <div className="mt-2">
          <ProgressBar percentage={stats.percentage} />
        </div>
        <p className="mt-1.5 text-right font-mono text-xl font-semibold text-[var(--color-accent)]">
          {stats.percentage === null ? '\u2014' : `${stats.percentage}%`}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats.totalStudyDays}</p>
          <p className="text-xs text-[var(--color-text-faint)]">Study days</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-lg font-semibold text-[var(--color-success)]">{stats.completed}</p>
          <p className="text-xs text-[var(--color-text-faint)]">Completed</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-lg font-semibold text-[var(--color-warning)]">{stats.inProgress}</p>
          <p className="text-xs text-[var(--color-text-faint)]">In progress</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats.remaining}</p>
          <p className="text-xs text-[var(--color-text-faint)]">Remaining</p>
        </Card>
      </div>

      {currentDay ? (
        <Card className="flex flex-col gap-3 border-[var(--color-accent)] p-5">
          <div className="flex items-center gap-2 text-[var(--color-accent)]">
            <Target size={16} aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wide">Current focus</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Day {currentDay.dayNumber}</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{currentDay.focus}</p>
            {currentDay.time && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{currentDay.time}</p>}
          </div>
          <div>
            <Button size="sm" disabled={updatingDayId === currentDay._id} onClick={() => handleSetStatus(currentDay._id, 'completed')}>
              Mark day {currentDay.dayNumber} complete
            </Button>
          </div>
        </Card>
      ) : (
        <EmptyState icon={Target} title="Roadmap complete" description="Every study day is marked complete. Nice work." />
      )}

      {nextUp.length > 0 && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Next up</p>
          <div className="flex flex-col gap-2">
            {nextUp.map((d) => (
              <div key={d._id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[var(--color-text-secondary)]">
                  Day {d.dayNumber} — {d.focus}
                </span>
                <ArrowRight size={14} className="shrink-0 text-[var(--color-text-faint)]" aria-hidden="true" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {weeks.map((week) => (
          <WeekSection
            key={week._id}
            week={week}
            isExpandedByDefault={week._id === currentWeekId}
            currentDayId={currentDay?._id}
            updatingDayId={updatingDayId}
            onSetStatus={handleSetStatus}
          />
        ))}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const moduleTab = searchParams.get('module') === 'hld' ? 'hld' : 'lld';
  const { list, listStatus } = useSelector((s) => s.roadmap);

  useEffect(() => {
    dispatch(fetchRoadmaps(moduleTab));
  }, [dispatch, moduleTab]);

  const setModuleTab = (m) => setSearchParams({ module: m });

  // Exactly one roadmap is expected for now (the seeded system one); this
  // picks the first available rather than assuming a specific index, so it
  // keeps working once multiple roadmaps exist.
  const activeRoadmap = list[0];

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Roadmap</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Follow your interview preparation plan and track your progress.
      </p>

      <div className="mt-5">
        <ModuleToggle value={moduleTab} onChange={setModuleTab} options={['lld', 'hld']} labels={{ lld: 'LLD', hld: 'HLD' }} />
      </div>

      {listStatus === 'loading' || listStatus === 'idle' ? (
        <div className="mt-5">
          <Skeleton className="h-32 w-full" />
        </div>
      ) : activeRoadmap ? (
        <RoadmapDetail roadmapId={activeRoadmap._id} />
      ) : (
        <div className="mt-5">
          <EmptyState
            icon={Map}
            title={moduleTab === 'hld' ? 'No HLD roadmap yet' : 'No roadmap yet'}
            description={
              moduleTab === 'hld'
                ? "An HLD roadmap hasn't been added yet."
                : "An LLD roadmap hasn't been seeded yet — run the project's seed script."
            }
          />
        </div>
      )}
    </div>
  );
}
