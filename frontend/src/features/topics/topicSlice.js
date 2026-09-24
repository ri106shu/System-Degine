import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import topicService from '../../services/topicService';

const extractError = (err) => err.response?.data?.message || 'Something went wrong.';

export const fetchTopics = createAsyncThunk('topics/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await topicService.getTopics(params);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createTopic = createAsyncThunk('topics/create', async (payload, { rejectWithValue }) => {
  try {
    return await topicService.createTopic(payload);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteTopic = createAsyncThunk('topics/delete', async (id, { rejectWithValue }) => {
  try {
    await topicService.deleteTopic(id);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const topicSlice = createSlice({
  name: 'topics',
  initialState: { items: [], status: 'idle', mutationStatus: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.topics;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createTopic.pending, (state) => {
        state.mutationStatus = 'loading';
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items.push(action.payload.topic);
      })
      .addCase(createTopic.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      });
  },
});

export default topicSlice.reducer;
