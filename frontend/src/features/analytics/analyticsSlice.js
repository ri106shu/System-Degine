import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../../services/analyticsService';

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async (params, { rejectWithValue }) => {
  try {
    return await analyticsService.getAnalytics(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load analytics.');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    data: null,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default analyticsSlice.reducer;
