import { useEffect, useState } from 'react';

// Remaining time is DERIVED from expiresAt and the real clock at every
// tick, never decremented as its own piece of state — that's what makes it
// immune to resetting on an unrelated re-render (e.g. the parent updating
// because the user typed in the answer textarea). The effect's dependency
// array is [expiresAt] specifically: the interval only restarts when the
// question actually changes, not on every render this hook's owner goes
// through for any other reason.
export function useCountdownSeconds(expiresAt) {
  const computeRemaining = () => (expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0);
  const [remainingSeconds, setRemainingSeconds] = useState(computeRemaining);

  useEffect(() => {
    if (!expiresAt) return undefined;
    setRemainingSeconds(computeRemaining());
    const interval = setInterval(() => setRemainingSeconds(computeRemaining()), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return remainingSeconds;
}

export const formatCountdown = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
