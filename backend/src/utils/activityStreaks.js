// Real activity, not the never-updated User.currentStreak/longestStreak
// fields (they exist on the schema but nothing anywhere writes to them —
// see the README). "Activity" means completing a topic, a question, a
// roadmap day, or finishing a mock — never just logging in, never an
// abandoned mock (started but given up on isn't preparation completed).

const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

const daysBetween = (a, b) => Math.round((a - b) / (24 * 60 * 60 * 1000));

// Pure function: dates in, streak numbers out — no DB, no Date.now() side
// effects beyond the one explicit "now" parameter, so this is fully
// deterministic and testable with constructed date sequences.
export const computeStreaks = (activityDates, now = new Date()) => {
  const uniqueDayKeys = [...new Set(activityDates.map(dayKey))].sort();
  const totalActiveDays = uniqueDayKeys.length;

  if (totalActiveDays === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const dayNumbers = uniqueDayKeys.map((k) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / (24 * 60 * 60 * 1000);
  });

  // Longest run of consecutive day-numbers anywhere in the history.
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < dayNumbers.length; i += 1) {
    if (dayNumbers[i] === dayNumbers[i - 1] + 1) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
  }

  // Current streak: alive if the most recent active day is today or
  // yesterday (today's activity hasn't happened yet doesn't break a streak
  // that's still within its day), broken otherwise. Counts consecutive days
  // backward from whichever of those two is the actual most recent one.
  const todayNumber = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / (24 * 60 * 60 * 1000));
  const mostRecent = dayNumbers[dayNumbers.length - 1];
  const gapFromToday = todayNumber - mostRecent;

  let currentStreak = 0;
  if (gapFromToday <= 1) {
    currentStreak = 1;
    for (let i = dayNumbers.length - 1; i > 0; i -= 1) {
      if (dayNumbers[i] === dayNumbers[i - 1] + 1) currentStreak += 1;
      else break;
    }
  }

  return { currentStreak, longestStreak, totalActiveDays };
};

// Just the day-bucketing, reused by preparation-activity charts (Analytics)
// that need counts-per-day rather than a single streak number.
export const groupByDay = (dates) => {
  const counts = {};
  for (const d of dates) {
    const key = dayKey(d);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

export const __private = { dayKey, daysBetween };
