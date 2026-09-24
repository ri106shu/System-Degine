import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminTopicService from '../../services/adminTopicService';

export const fetchAdminTopics = createAsyncThunk('adminTopics/fetch', async (params, { rejectWithValue }) => {
  try {
    return await adminTopicService.getTopics(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load topics.');
  }
});

export const createAdminTopic = createAsyncThunk('adminTopics/create', async (payload, { rejectWithValue }) => {
  try {
    const topic = await adminTopicService.createTopic(payload);
    toast.success(`Topic "${topic.name}" created`);
    return topic;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not create this topic.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateAdminTopic = createAsyncThunk('adminTopics/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const topic = await adminTopicService.updateTopic(id, payload);
    toast.success(`Topic "${topic.name}" updated`);
    return topic;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not update this topic.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const deleteAdminTopic = createAsyncThunk('adminTopics/delete', async (id, { rejectWithValue }) => {
  try {
    const topic = await adminTopicService.deleteTopic(id);
    toast.success(`Topic "${topic.name}" deleted`);
    return topic;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this topic.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const restoreAdminTopic = createAsyncThunk('adminTopics/restore', async (id, { rejectWithValue }) => {
  try {
    const topic = await adminTopicService.restoreTopic(id);
    toast.success(`Topic "${topic.name}" restored`);
    return topic;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not restore this topic.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const adminTopicsSlice = createSlice({
  name: 'adminTopics',
  initialState: {
    topics: [],
    total: 0,
    page: 1,
    totalPages: 1,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminTopics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminTopics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.topics = action.payload.topics;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminTopics.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createAdminTopic.fulfilled, (state, action) => {
        state.topics.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAdminTopic.fulfilled, (state, action) => {
        const idx = state.topics.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.topics[idx] = action.payload;
      })
      .addCase(deleteAdminTopic.fulfilled, (state, action) => {
        const idx = state.topics.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.topics[idx] = action.payload;
      })
      .addCase(restoreAdminTopic.fulfilled, (state, action) => {
        const idx = state.topics.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.topics[idx] = action.payload;
      });
  },
});

export default adminTopicsSlice.reducer;
