import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminMockInterviewService from '../../services/adminMockInterviewService';

export const fetchAdminMockInterviews = createAsyncThunk('adminMockInterviews/fetchList', async (params, { rejectWithValue }) => {
  try {
    return await adminMockInterviewService.getList(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load mock interviews.');
  }
});

export const fetchAdminMockInterviewSummary = createAsyncThunk('adminMockInterviews/fetchSummary', async (params, { rejectWithValue }) => {
  try {
    return await adminMockInterviewService.getSummary(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load summary.');
  }
});

export const fetchAdminMockInterviewDetail = createAsyncThunk('adminMockInterviews/fetchDetail', async (id, { rejectWithValue }) => {
  try {
    return await adminMockInterviewService.getDetail(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this interview.');
  }
});

export const deleteAdminMockInterview = createAsyncThunk('adminMockInterviews/delete', async (id, { rejectWithValue }) => {
  try {
    await adminMockInterviewService.deleteInterview(id);
    toast.success('Mock interview deleted');
    return id;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this mock interview.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

// Returns deletedCount rather than trying to locally reconcile the list —
// a bulk delete can remove more rows than the current page even holds (it
// targets every match across every page, not just what's visible), so the
// caller re-fetches the list and summary afterward instead of splicing
// state here.
export const deleteAllAdminMockInterviews = createAsyncThunk('adminMockInterviews/deleteAll', async (params, { rejectWithValue }) => {
  try {
    const { deletedCount } = await adminMockInterviewService.deleteAll(params);
    if (deletedCount > 0) toast.success(`Deleted ${deletedCount} mock interview${deletedCount === 1 ? '' : 's'}`);
    return deletedCount;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete these mock interviews.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const adminMockInterviewsSlice = createSlice({
  name: 'adminMockInterviews',
  initialState: {
    interviews: [],
    total: 0,
    page: 1,
    totalPages: 1,
    listStatus: 'idle',
    summary: null,
    summaryStatus: 'idle',
    detail: null,
    detailStatus: 'idle',
  },
  reducers: {
    clearDetail: (state) => {
      state.detail = null;
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMockInterviews.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchAdminMockInterviews.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.interviews = action.payload.interviews;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminMockInterviews.rejected, (state) => {
        state.listStatus = 'failed';
      })
      .addCase(fetchAdminMockInterviewSummary.pending, (state) => {
        state.summaryStatus = 'loading';
      })
      .addCase(fetchAdminMockInterviewSummary.fulfilled, (state, action) => {
        state.summaryStatus = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchAdminMockInterviewSummary.rejected, (state) => {
        state.summaryStatus = 'failed';
      })
      .addCase(fetchAdminMockInterviewDetail.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchAdminMockInterviewDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detail = action.payload;
      })
      .addCase(fetchAdminMockInterviewDetail.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      .addCase(deleteAdminMockInterview.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.interviews = state.interviews.filter((m) => m._id !== deletedId);
        state.total = Math.max(0, state.total - 1);
        if (state.detail?._id === deletedId) {
          state.detail = null;
          state.detailStatus = 'idle';
        }
      });
  },
});

export const { clearDetail } = adminMockInterviewsSlice.actions;
export default adminMockInterviewsSlice.reducer;
