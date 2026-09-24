import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import timingService from '../../services/timingService';

export const fetchTiming = createAsyncThunk('timing/fetch', async (_, { rejectWithValue }) => {
  try {
    return await timingService.getTiming();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load timing settings.');
  }
});

export const updateTiming = createAsyncThunk('timing/update', async (payload, { rejectWithValue }) => {
  try {
    return await timingService.updateTiming(payload);
  } catch (err) {
    const message = err.response?.data?.message || 'Could not save that duration.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const resetTiming = createAsyncThunk('timing/reset', async (module, { rejectWithValue }) => {
  try {
    const data = await timingService.resetTiming(module);
    toast.success(`${module.toUpperCase()} timing reset to defaults`);
    return data;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not reset timing.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const timingSlice = createSlice({
  name: 'timing',
  initialState: {
    data: null, // { lld: { topic: {easy:{min,max,default,selected,isCustom}, ...}, question: {...}, questionPhases }, hld: {...} }
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTiming.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTiming.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchTiming.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(updateTiming.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(resetTiming.fulfilled, (state, action) => {
        state.data = action.payload;
      });
  },
});

export default timingSlice.reducer;
