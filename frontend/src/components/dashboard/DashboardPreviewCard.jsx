import { Flame, Star, Trophy } from 'lucide-react';

const WEEK = [
  { day: 'M', h: 60 },
  { day: 'T', h: 40 },
  { day: 'W', h: 80 },
  { day: 'T', h: 35 },
  { day: 'F', h: 65 },
  { day: 'S', h: 90 },
  { day: 'S', h: 25 },
];

// Illustrative only — not wired to real data. Gives the landing page a
// concrete, honest look at the actual dashboard UI rather than stock art.
export default function DashboardPreviewCard() {
  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_1px_0_0_var(--color-border)]">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Good evening, Priya</p>
        <span className="rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 font-mono text-xs text-[var(--color-success)]">
          72% LLD
        </span>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--color-surface-2)] p-3">
          <Flame size={15} className="mb-1.5 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">12</p>
          <p className="text-xs text-[var(--color-text-faint)]">day streak</p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-2)] p-3">
          <Star size={15} className="mb-1.5 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">1,240</p>
          <p className="text-xs text-[var(--color-text-faint)]">XP</p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-2)] p-3">
          <Trophy size={15} className="mb-1.5 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">8</p>
          <p className="text-xs text-[var(--color-text-faint)]">level</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-medium text-[var(--color-text-faint)]">This week</p>
      <div className="flex h-16 items-end gap-2">
        {WEEK.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="w-full rounded-sm bg-[var(--color-accent)]/70"
              style={{ height: `${d.h}%` }}
            />
            <span className="text-[10px] text-[var(--color-text-faint)]">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
