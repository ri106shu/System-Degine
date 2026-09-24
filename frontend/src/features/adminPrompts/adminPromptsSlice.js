import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminPromptService from '../../services/adminPromptService';

export const fetchAdminPrompts = createAsyncThunk('adminPrompts/fetch', async (params, { rejectWithValue }) => {
  try {
    return await adminPromptService.getPrompts(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load prompts.');
  }
});

export const createAdminPrompt = createAsyncThunk('adminPrompts/create', async (payload, { rejectWithValue }) => {
  try {
    const prompt = await adminPromptService.createPrompt(payload);
    toast.success('Prompt created');
    return prompt;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not create this prompt.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateAdminPrompt = createAsyncThunk('adminPrompts/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const prompt = await adminPromptService.updatePrompt(id, payload);
    toast.success('Prompt updated');
    return prompt;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not update this prompt.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const deleteAdminPrompt = createAsyncThunk('adminPrompts/delete', async (id, { rejectWithValue }) => {
  try {
    const prompt = await adminPromptService.deletePrompt(id);
    toast.success('Prompt deleted');
    return prompt;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this prompt.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const restoreAdminPrompt = createAsyncThunk('adminPrompts/restore', async (id, { rejectWithValue }) => {
  try {
    const prompt = await adminPromptService.restorePrompt(id);
    toast.success('Prompt restored');
    return prompt;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not restore this prompt.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const adminPromptsSlice = createSlice({
  name: 'adminPrompts',
  initialState: { prompts: [], total: 0, page: 1, totalPages: 1, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPrompts.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAdminPrompts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.prompts = action.payload.prompts;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminPrompts.rejected, (state) => { state.status = 'failed'; })
      .addCase(createAdminPrompt.fulfilled, (state, action) => {
        state.prompts.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAdminPrompt.fulfilled, (state, action) => {
        const idx = state.prompts.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.prompts[idx] = action.payload;
      })
      .addCase(deleteAdminPrompt.fulfilled, (state, action) => {
        const idx = state.prompts.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.prompts[idx] = action.payload;
      })
      .addCase(restoreAdminPrompt.fulfilled, (state, action) => {
        const idx = state.prompts.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.prompts[idx] = action.payload;
      });
  },
});

export default adminPromptsSlice.reducer;
