import { Link } from 'react-router';
import { Calendar, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ROUTES } from '../../app/constants';

export default function TodaysPreparation({ roadmapToday }) {
  if (!roadmapToday) {
    return (
      <Card className="flex flex-col items-start gap-3 p-5">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--color-text-faint)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Today's preparation</h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">No roadmap has been seeded yet.</p>
      </Card>
    );
  }

  const { currentDay, completedStudyDays, totalStudyDays } = roadmapToday;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Today's preparation</h3>
        </div>
        <span className="font-mono text-xs text-[var(--color-text-faint)]">
          {completedStudyDays} / {totalStudyDays} days
        </span>
      </div>

      {currentDay ? (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Day {currentDay.dayNumber}</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{currentDay.focus}</p>
            {currentDay.time && <p className="mt-1 text-xs text-[var(--color-text-faint)]">{currentDay.time}</p>}
          </div>
          <Link to={ROUTES.ROADMAP}>
            <Button size="sm">Continue roadmap</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="flex items-center gap-1.5 text-sm text-[var(--color-success)]">
            <CheckCircle2 size={15} aria-hidden="true" />
            Every roadmap day is complete.
          </p>
          <Link to={ROUTES.ROADMAP}>
            <Button variant="secondary" size="sm">
              Review roadmap
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
