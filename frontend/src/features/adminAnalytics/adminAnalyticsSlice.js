import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAnalyticsService from '../../services/adminAnalyticsService';

export const fetchAdminAnalytics = createAsyncThunk('adminAnalytics/fetch', async (range, { rejectWithValue }) => {
  try {
    return await adminAnalyticsService.getAnalytics(range);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load analytics.');
  }
});

const adminAnalyticsSlice = createSlice({
  name: 'adminAnalytics',
  initialState: { data: null, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchAdminAnalytics.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default adminAnalyticsSlice.reducer;
