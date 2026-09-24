import { Pencil, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };
const TYPE_LABELS = { topic: 'Theory', question: 'Question' };

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function NoteDetailModal({ open, note, onClose, onEdit, onDelete }) {
  if (!note) return <Modal open={open} title="Note" onClose={onClose} />;

  return (
    <Modal
      open={open}
      title={`${MODULE_LABELS[note.module] || note.module} \u00b7 ${TYPE_LABELS[note.targetType] || note.targetType}`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs text-[var(--color-text-faint)]">
            {note.targetType === 'topic' ? 'Topic' : 'Question'}: {note.targetLabel}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{note.title}</h3>
        </div>

        <div className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-text-secondary)]">
          {note.content || 'No content written yet.'}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-faint)]">
          <span>Created: {formatDate(note.createdAt)}</span>
          <span>Updated: {formatDate(note.updatedAt)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onDelete(note)}>
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </Button>
          <Button variant="secondary" onClick={() => onEdit(note)}>
            <Pencil size={15} aria-hidden="true" />
            Edit
          </Button>
        </div>
      </div>
    </Modal>
  );
}
