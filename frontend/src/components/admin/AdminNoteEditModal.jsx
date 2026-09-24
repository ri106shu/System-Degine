import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Info, Save } from 'lucide-react';
import { correctAdminNote } from '../../features/adminNotes/adminNotesSlice';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

export default function AdminNoteEditModal({ open, note, onClose }) {
  const dispatch = useDispatch();
  const saveStatus = useSelector((s) => s.adminNotes.saveStatus);

  const [form, setForm] = useState({ title: note?.title || '', content: note?.content || '' });
  const identity = `${open}-${note?._id || 'none'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm({ title: note?.title || '', content: note?.content || '' });
  }

  const submitting = saveStatus === 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !note) return;
    const result = await dispatch(correctAdminNote({ id: note._id, payload: { title: form.title, content: form.content } }));
    if (!result.error) onClose();
    // On failure, the modal stays open with the admin's edits intact —
    // correctAdminNote's own rejection already showed a toast.
  };

  return (
    <Modal open={open} title="Admin Edit" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-3">
          <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-accent)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            This note was created by <strong className="text-[#16181D] dark:text-[#E9EAEC]">{note?.user?.name || 'this user'}</strong>. Changes
            will be visible to the user.
          </p>
        </div>

        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea label="Content" rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save size={15} aria-hidden="true" />
            {submitting ? 'Saving…' : 'Save Correction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
