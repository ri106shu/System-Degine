import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminNoteService from '../../services/adminNoteService';

export const fetchAdminNotes = createAsyncThunk('adminNotes/fetchList', async (params, { rejectWithValue }) => {
  try {
    return await adminNoteService.getNotes(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load notes.');
  }
});

export const fetchAdminNoteStats = createAsyncThunk('adminNotes/fetchStats', async (_, { rejectWithValue }) => {
  try {
    return await adminNoteService.getStats();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load note statistics.');
  }
});

export const fetchAdminNoteDetail = createAsyncThunk('adminNotes/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    return await adminNoteService.getNote(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this note.');
  }
});

export const correctAdminNote = createAsyncThunk('adminNotes/correct', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const note = await adminNoteService.updateNote(id, payload);
    toast.success('User note updated successfully');
    return note;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not save this correction. Your text is still here — try again.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const deleteAdminNote = createAsyncThunk('adminNotes/delete', async (id, { rejectWithValue }) => {
  try {
    await adminNoteService.deleteNote(id);
    toast.success('User note deleted');
    return id;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this note.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const adminNotesSlice = createSlice({
  name: 'adminNotes',
  initialState: {
    notes: [],
    total: 0,
    page: 1,
    totalPages: 1,
    listStatus: 'idle',
    stats: null,
    statsStatus: 'idle',
    detail: null,
    detailStatus: 'idle',
    saveStatus: 'idle',
  },
  reducers: {
    clearAdminNoteDetail: (state) => {
      state.detail = null;
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminNotes.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchAdminNotes.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.notes = action.payload.notes;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminNotes.rejected, (state) => {
        state.listStatus = 'failed';
      })
      .addCase(fetchAdminNoteStats.pending, (state) => {
        state.statsStatus = 'loading';
      })
      .addCase(fetchAdminNoteStats.fulfilled, (state, action) => {
        state.statsStatus = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchAdminNoteStats.rejected, (state) => {
        state.statsStatus = 'failed';
      })
      .addCase(fetchAdminNoteDetail.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchAdminNoteDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detail = action.payload;
      })
      .addCase(fetchAdminNoteDetail.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      .addCase(correctAdminNote.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(correctAdminNote.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        const note = action.payload;
        const idx = state.notes.findIndex((n) => n._id === note._id);
        if (idx !== -1) state.notes[idx] = note;
        if (state.detail?._id === note._id) state.detail = { ...state.detail, ...note };
      })
      .addCase(correctAdminNote.rejected, (state) => {
        state.saveStatus = 'failed';
      })
      .addCase(deleteAdminNote.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.notes = state.notes.filter((n) => n._id !== deletedId);
        state.total = Math.max(0, state.total - 1);
        if (state.detail?._id === deletedId) state.detail = null;
      });
  },
});

export const { clearAdminNoteDetail } = adminNotesSlice.actions;
export default adminNotesSlice.reducer;
