import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminRoadmapService from '../../services/adminRoadmapService';

const withReload = (fn, successMessage) =>
  async (payload, { getState, rejectWithValue, dispatch }) => {
    try {
      await fn(payload);
      if (successMessage) toast.success(successMessage);
      const moduleSlug = getState().adminRoadmap.moduleSlug;
      if (moduleSlug) dispatch(fetchAdminRoadmap(moduleSlug));
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'That action could not be completed.';
      toast.error(message);
      return rejectWithValue(message);
    }
  };

export const fetchAdminRoadmap = createAsyncThunk('adminRoadmap/fetch', async (moduleSlug, { rejectWithValue }) => {
  try {
    const result = await adminRoadmapService.getByModule(moduleSlug);
    return { moduleSlug, ...result };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this roadmap.');
  }
});

export const createRoadmap = createAsyncThunk(
  'adminRoadmap/createRoadmap',
  withReload(({ moduleSlug, payload }) => adminRoadmapService.createRoadmap(moduleSlug, payload), 'Roadmap created')
);
export const updateRoadmap = createAsyncThunk(
  'adminRoadmap/updateRoadmap',
  withReload(({ id, payload }) => adminRoadmapService.updateRoadmap(id, payload), 'Roadmap updated')
);
export const toggleRoadmapActive = createAsyncThunk(
  'adminRoadmap/toggleRoadmapActive',
  withReload(({ id, isActive }) => adminRoadmapService.toggleActive(id, isActive), null)
);
export const duplicateRoadmap = createAsyncThunk(
  'adminRoadmap/duplicateRoadmap',
  withReload(({ id }) => adminRoadmapService.duplicateRoadmap(id), 'Roadmap duplicated (inactive copy created)')
);

export const createWeek = createAsyncThunk(
  'adminRoadmap/createWeek',
  withReload(({ roadmapId, payload }) => adminRoadmapService.createWeek(roadmapId, payload), 'Week added')
);
export const updateWeek = createAsyncThunk(
  'adminRoadmap/updateWeek',
  withReload(({ weekId, payload }) => adminRoadmapService.updateWeek(weekId, payload), 'Week updated')
);
export const deleteWeek = createAsyncThunk('adminRoadmap/deleteWeek', withReload(({ weekId }) => adminRoadmapService.deleteWeek(weekId), 'Week deleted'));
export const moveWeek = createAsyncThunk(
  'adminRoadmap/moveWeek',
  withReload(({ weekId, direction }) => adminRoadmapService.moveWeek(weekId, direction), null)
);

export const createDay = createAsyncThunk(
  'adminRoadmap/createDay',
  withReload(({ weekId, payload }) => adminRoadmapService.createDay(weekId, payload), 'Day added')
);
export const updateDay = createAsyncThunk(
  'adminRoadmap/updateDay',
  withReload(({ dayId, payload }) => adminRoadmapService.updateDay(dayId, payload), 'Day updated')
);
export const deleteDay = createAsyncThunk('adminRoadmap/deleteDay', withReload(({ dayId }) => adminRoadmapService.deleteDay(dayId), 'Day deleted'));
export const moveDay = createAsyncThunk(
  'adminRoadmap/moveDay',
  withReload(({ dayId, direction }) => adminRoadmapService.moveDay(dayId, direction), null)
);

const adminRoadmapSlice = createSlice({
  name: 'adminRoadmap',
  initialState: {
    moduleSlug: null,
    roadmap: null,
    weeks: [],
    stats: { totalWeeks: 0, totalDays: 0, studyDays: 0, restDays: 0 },
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminRoadmap.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminRoadmap.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.moduleSlug = action.payload.moduleSlug;
        state.roadmap = action.payload.roadmap;
        state.weeks = action.payload.weeks;
        state.stats = action.payload.stats;
      })
      .addCase(fetchAdminRoadmap.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default adminRoadmapSlice.reducer;
