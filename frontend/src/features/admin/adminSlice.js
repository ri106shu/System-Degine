import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../../services/adminService';

export const fetchAdminDashboard = createAsyncThunk('admin/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    return await adminService.getDashboard();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load admin dashboard.');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboard: null,
    dashboardStatus: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.dashboardStatus = 'loading';
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.dashboardStatus = 'succeeded';
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state) => {
        state.dashboardStatus = 'failed';
      });
  },
});

export default adminSlice.reducer;
