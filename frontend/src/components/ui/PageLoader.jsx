// Full-viewport loader shown only while we're checking for an existing
// session on first load — deliberately quiet, not a spinner-heavy splash.
export default function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-base)]">
      <div className="flex items-center gap-3 text-[var(--color-text-faint)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
        <span className="font-mono text-sm">Loading InterviewForge…</span>
      </div>
    </div>
  );
}
