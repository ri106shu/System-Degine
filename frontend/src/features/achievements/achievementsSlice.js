import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import achievementService from '../../services/achievementService';

export const fetchAchievements = createAsyncThunk('achievements/fetch', async (_, { rejectWithValue }) => {
  try {
    const [achievements, stats] = await Promise.all([achievementService.getAchievements(), achievementService.getStats()]);
    return { achievements, stats };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load achievements.');
  }
});

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState: {
    achievements: [],
    stats: null,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.achievements = action.payload.achievements;
        state.stats = action.payload.stats;
      })
      .addCase(fetchAchievements.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default achievementsSlice.reducer;
