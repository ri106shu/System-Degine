import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import roadmapService from '../../services/roadmapService';
import progressService from '../../services/progressService';
import { notifyNewAchievements } from '../../utils/notifyAchievements';

export const fetchRoadmaps = createAsyncThunk('roadmap/fetchList', async (moduleSlug, { rejectWithValue }) => {
  try {
    return await roadmapService.getRoadmaps(moduleSlug);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load roadmaps.');
  }
});

export const fetchRoadmapDetail = createAsyncThunk('roadmap/fetchDetail', async (roadmapId, { rejectWithValue }) => {
  try {
    return await roadmapService.getRoadmapDetail(roadmapId);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this roadmap.');
  }
});

export const setRoadmapDayStatus = createAsyncThunk(
  'roadmap/setDayStatus',
  async ({ dayId, status }, { rejectWithValue }) => {
    try {
      const { newAchievements } = await progressService.updateRoadmapProgress(dayId, { status });
      notifyNewAchievements(newAchievements);
      return { dayId, status };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not update this day.';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState: {
    list: [], // roadmaps for the current module tab
    listStatus: 'idle',
    detail: null, // { roadmap, weeks, stats, currentDay, nextUp }
    detailStatus: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoadmaps.pending, (state) => {
        state.listStatus = 'loading';
      })
      .addCase(fetchRoadmaps.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchRoadmaps.rejected, (state) => {
        state.listStatus = 'failed';
      })
      .addCase(fetchRoadmapDetail.pending, (state) => {
        state.detailStatus = 'loading';
      })
      .addCase(fetchRoadmapDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.detail = action.payload;
      })
      .addCase(fetchRoadmapDetail.rejected, (state) => {
        state.detailStatus = 'failed';
      })
      .addCase(setRoadmapDayStatus.fulfilled, (state, action) => {
        // Optimistic-after-success local update, avoiding a full re-fetch
        // for a single day's status change — find and patch that one day
        // (and recompute the light bits: week/overall counts) in place.
        if (!state.detail) return;
        const { dayId, status } = action.payload;
        for (const week of state.detail.weeks) {
          const day = week.days.find((d) => d._id === dayId);
          if (day) day.status = status;
        }
      });
  },
});

export default roadmapSlice.reducer;
