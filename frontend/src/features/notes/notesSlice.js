import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import noteService from '../../services/noteService';

const targetKey = (targetType, targetId) => `${targetType}:${targetId}`;

// Fetches the user's full note list (used by the Notes page directly, and
// by Topics/Questions pages as a one-time "prime the cache" call) — the
// byTarget map built from it is what lets a topic/question row know
// instantly whether a note exists, without a request per row.
export const fetchNotes = createAsyncThunk('notes/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await noteService.getNotes(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load notes.');
  }
});

export const fetchNoteDetail = createAsyncThunk('notes/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    return await noteService.getNote(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this note.');
  }
});

export const saveNote = createAsyncThunk('notes/save', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const note = id ? await noteService.updateNote(id, payload) : await noteService.createNote(payload);
    toast.success(id ? 'Note updated successfully' : 'Note saved successfully');
    return note;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not save this note. Your text is still here — try again.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const deleteNote = createAsyncThunk('notes/delete', async (id, { rejectWithValue }) => {
  try {
    await noteService.deleteNote(id);
    toast.success('Note deleted');
    return id;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this note.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    byTarget: {}, // `${targetType}:${targetId}` -> note, derived from `notes`
    status: 'idle',
    detail: null,
    detailStatus: 'idle',
    saveStatus: 'idle',
  },
  reducers: {
    clearNoteDetail: (state) => {
      state.detail = null;
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notes = action.payload;
        state.byTarget = {};
        for (const n of action.payload) {
          state.byTarget[targetKey(n.targetType, n.targetId)] = n;
        }
      })
      .addCase(fetchNotes.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchNoteDetail.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchNoteDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detail = action.payload;
      })
      .addCase(fetchNoteDetail.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      .addCase(saveNote.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(saveNote.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        const note = action.payload;
        const key = targetKey(note.targetType, note.targetId);
        state.byTarget[key] = note;
        const idx = state.notes.findIndex((n) => n._id === note._id);
        if (idx !== -1) state.notes[idx] = note;
        else state.notes.unshift(note);
        if (state.detail?._id === note._id) state.detail = note;
      })
      .addCase(saveNote.rejected, (state) => {
        state.saveStatus = 'failed';
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const deleted = state.notes.find((n) => n._id === deletedId);
        state.notes = state.notes.filter((n) => n._id !== deletedId);
        if (deleted) delete state.byTarget[targetKey(deleted.targetType, deleted.targetId)];
        if (state.detail?._id === deletedId) state.detail = null;
      });
  },
});

export const { clearNoteDetail } = notesSlice.actions;
export default notesSlice.reducer;
