import Note from '../models/Note.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import ApiError from '../utils/ApiError.js';

// Resolves the real target document and, from it, the module it belongs
// to — the whole point being that a client can never claim "this is an LLD
// note" or "this is a topic note" on its own say-so. If the target doesn't
// exist or has been soft-deleted, there is nothing valid to attach a note
// to.
const resolveTarget = async (targetType, targetId) => {
  const Model = targetType === 'topic' ? Topic : Question;
  const target = await Model.findOne({ _id: targetId, isActive: true }).populate('moduleId', 'slug');
  if (!target) {
    throw new ApiError(404, `The ${targetType} this note would attach to doesn't exist or is no longer active`);
  }
  return target;
};

const toResponse = (note) => ({
  _id: note._id,
  moduleId: note.moduleId,
  targetType: note.targetType,
  targetId: note.targetId,
  title: note.title,
  content: note.content,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

// GET /api/notes — the logged-in user's own notes only, ever. Populates
// enough of the target to show "OOP" / "Design Parking Lot" on a card
// without a second round trip per note.
export const getNoteList = async (userId, { module, type, search } = {}) => {
  const filter = { userId };
  if (type && type !== 'all') filter.targetType = type;

  if (module && module !== 'all') {
    const Module = (await import('../models/Module.js')).default;
    const foundModule = await Module.findOne({ slug: module });
    filter.moduleId = foundModule?._id || null;
  }

  let notes = await Note.find(filter)
    .sort('-updatedAt')
    .populate('moduleId', 'slug name')
    .populate({ path: 'targetId', select: 'name title' })
    .lean();

  // Search spans note title/content AND the related topic/question title —
  // done in application code rather than a Mongo text index, since it
  // needs to reach across the polymorphic targetId reference (topic name
  // vs question title live in different collections), which a single
  // server-side query can't cleanly express without an aggregation
  // pipeline heavier than this dataset size actually needs.
  if (search) {
    const q = search.trim().toLowerCase();
    notes = notes.filter((n) => {
      const targetLabel = (n.targetId?.name || n.targetId?.title || '').toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || targetLabel.includes(q);
    });
  }

  return notes.map((n) => ({
    _id: n._id,
    module: n.moduleId?.slug,
    targetType: n.targetType,
    targetId: n.targetId?._id,
    targetLabel: n.targetId?.name || n.targetId?.title || 'Untitled',
    title: n.title,
    content: n.content,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));
};

export const getNoteById = async (userId, id) => {
  const note = await Note.findOne({ _id: id, userId })
    .populate('moduleId', 'slug name')
    .populate({ path: 'targetId', select: 'name title' });
  if (!note) throw new ApiError(404, 'Note not found');
  return {
    _id: note._id,
    module: note.moduleId?.slug,
    targetType: note.targetType,
    targetId: note.targetId?._id,
    targetLabel: note.targetId?.name || note.targetId?.title || 'Untitled',
    title: note.title,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
};

// Used by the Topic/Question pages to answer "does a note already exist
// for this?" without the page having to load the whole Notes list. Returns
// null rather than 404 when there isn't one yet — that's the normal,
// expected state for most topics/questions, not an error.
export const getNoteByTarget = async (userId, targetType, targetId) => {
  const note = await Note.findOne({ userId, targetType, targetId });
  return note ? toResponse(note) : null;
};

// Upsert-safe: if a note already exists for this user+target (the unique
// index would otherwise reject a second create), this edits it instead of
// erroring — a defensive backstop for the rare case where the frontend's
// own "note already exists, show Edit instead" check is stale (e.g. two
// tabs open), not something the normal flow relies on.
export const createNote = async (userId, { targetType, targetId, title, content }) => {
  const target = await resolveTarget(targetType, targetId);

  const existing = await Note.findOne({ userId, targetType, targetId });
  if (existing) {
    existing.title = title?.trim() || existing.title;
    existing.content = content ?? existing.content;
    await existing.save();
    return toResponse(existing);
  }

  const note = await Note.create({
    userId,
    moduleId: target.moduleId._id,
    targetType,
    targetId,
    title: title?.trim() || target.name || target.title,
    content: content || '',
  });
  return toResponse(note);
};

export const updateNote = async (userId, id, { title, content }) => {
  const note = await Note.findOne({ _id: id, userId });
  if (!note) throw new ApiError(404, 'Note not found');

  if (title !== undefined) note.title = title.trim();
  if (content !== undefined) note.content = content;
  await note.save();

  return toResponse(note);
};

export const deleteNote = async (userId, id) => {
  const note = await Note.findOneAndDelete({ _id: id, userId });
  if (!note) throw new ApiError(404, 'Note not found');
  return { deletedId: id };
};
