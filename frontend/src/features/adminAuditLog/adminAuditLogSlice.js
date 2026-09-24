import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminAuditLogService from '../../services/adminAuditLogService';

export const fetchAdminAuditLog = createAsyncThunk('adminAuditLog/fetch', async (params, { rejectWithValue }) => {
  try {
    return await adminAuditLogService.getAuditLog(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load the audit log.');
  }
});

const adminAuditLogSlice = createSlice({
  name: 'adminAuditLog',
  initialState: { entries: [], total: 0, page: 1, totalPages: 1, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAuditLog.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminAuditLog.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.entries = action.payload.entries;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminAuditLog.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default adminAuditLogSlice.reducer;
