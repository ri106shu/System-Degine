import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import dashboardService from '../../services/dashboardService';

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { rejectWithValue }) => {
  try {
    return await dashboardService.getDashboard();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load dashboard data.');
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { data: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
