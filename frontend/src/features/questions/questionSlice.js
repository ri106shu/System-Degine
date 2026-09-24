import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import questionService from '../../services/questionService';

const extractError = (err) => err.response?.data?.message || 'Something went wrong.';

export const fetchQuestions = createAsyncThunk('questions/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await questionService.getQuestions(params);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createQuestion = createAsyncThunk('questions/create', async (payload, { rejectWithValue }) => {
  try {
    return await questionService.createQuestion(payload);
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteQuestion = createAsyncThunk('questions/delete', async (id, { rejectWithValue }) => {
  try {
    await questionService.deleteQuestion(id);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const questionSlice = createSlice({
  name: 'questions',
  initialState: { items: [], status: 'idle', mutationStatus: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.questions;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(createQuestion.pending, (state) => {
        state.mutationStatus = 'loading';
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.items.push(action.payload.question);
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.items = state.items.filter((q) => q._id !== action.payload);
      });
  },
});

export default questionSlice.reducer;
