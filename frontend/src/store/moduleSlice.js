import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import moduleService from '../services/moduleService';

// Shared reference data (LLD / HLD) used by roadmap, topics, questions and
// mock setup alike — deliberately not tucked inside one feature folder.
export const fetchModules = createAsyncThunk(
  'modules/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await moduleService.getModules();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

const moduleSlice = createSlice({
  name: 'modules',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModules.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.modules;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default moduleSlice.reducer;
