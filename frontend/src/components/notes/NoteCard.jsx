import { FileText, BookOpen, CircleHelp, Layers, Network, Pencil, Trash2 } from 'lucide-react';

const MODULE_META = {
  lld: { label: 'LLD', icon: Layers },
  hld: { label: 'HLD', icon: Network },
};
const TYPE_META = {
  topic: { label: 'Theory', icon: BookOpen },
  question: { label: 'Question', icon: CircleHelp },
};

const timeAgo = (iso) => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function NoteCard({ note, onOpen, onEdit, onDelete }) {
  const moduleMeta = MODULE_META[note.module] || MODULE_META.lld;
  const typeMeta = TYPE_META[note.targetType] || TYPE_META.topic;
  const ModuleIcon = moduleMeta.icon;
  const TypeIcon = typeMeta.icon;
  const preview = note.content?.trim().replace(/\s+/g, ' ').slice(0, 140);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
          <ModuleIcon size={10} aria-hidden="true" />
          {moduleMeta.label}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
          <TypeIcon size={10} aria-hidden="true" />
          {typeMeta.label}
        </span>
      </div>

      <button type="button" onClick={() => onOpen(note)} className="mt-2 block w-full text-left">
        <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{note.title}</p>
        {preview && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {preview}
            {note.content.length > 140 ? '…' : ''}
          </p>
        )}
        <p className="mt-1.5 text-xs text-[var(--color-text-faint)]">
          {note.targetType === 'topic' ? 'Topic' : 'Question'}: {note.targetLabel}
        </p>
      </button>

      <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2.5">
        <span className="flex items-center gap-1 text-xs text-[var(--color-text-faint)]">
          <FileText size={11} aria-hidden="true" />
          Updated {timeAgo(note.updatedAt)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="rounded-lg p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)] hover:text-[#16181D] dark:hover:text-[#E9EAEC]"
            aria-label={`Edit note: ${note.title}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="rounded-lg p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
            aria-label={`Delete note: ${note.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
