import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save } from 'lucide-react';
import { saveNote } from '../../features/notes/notesSlice';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

// `target` is { targetType, targetId, defaultTitle } for a NEW note, or
// `existingNote` is a full note object to edit. Exactly one is passed.
export default function NoteEditorModal({ open, target, existingNote, onClose, onSaved }) {
  const dispatch = useDispatch();
  const saveStatus = useSelector((s) => s.notes.saveStatus);

  const buildForm = () =>
    existingNote ? { title: existingNote.title, content: existingNote.content } : { title: target?.defaultTitle || '', content: '' };
  const [form, setForm] = useState(buildForm());

  // Re-seeds the form whenever the modal opens on a different note/target —
  // keyed on identity during render, matching the pattern already used for
  // every other create/edit modal in this app, rather than a useEffect.
  const identity = `${open}-${existingNote?._id || target?.targetId || 'new'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm(buildForm());
  }

  const submitting = saveStatus === 'loading';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevents a double-submit from a second click while saving
    const payload = existingNote
      ? { title: form.title, content: form.content }
      : { targetType: target.targetType, targetId: target.targetId, title: form.title, content: form.content };
    const result = await dispatch(saveNote({ id: existingNote?._id, payload }));
    if (!result.error) {
      onSaved?.(result.payload);
      onClose();
    }
    // On failure, the modal stays open with the user's text exactly as
    // they left it — saveNote's own rejection already showed a toast, and
    // nothing here clears `form`.
  };

  return (
    <Modal open={open} title={existingNote ? 'Edit note' : 'Add note'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea
          label="Content"
          rows={10}
          placeholder={'What I learned...\n\nImportant concepts...\n\nInterview points...'}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            <Save size={15} aria-hidden="true" />
            {submitting ? 'Saving…' : 'Save note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
