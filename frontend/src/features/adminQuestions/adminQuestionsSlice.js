import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminQuestionService from '../../services/adminQuestionService';

export const fetchAdminQuestions = createAsyncThunk('adminQuestions/fetch', async (params, { rejectWithValue }) => {
  try {
    return await adminQuestionService.getQuestions(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load questions.');
  }
});

export const createAdminQuestion = createAsyncThunk('adminQuestions/create', async (payload, { rejectWithValue }) => {
  try {
    const question = await adminQuestionService.createQuestion(payload);
    toast.success(`Question created`);
    return question;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not create this question.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateAdminQuestion = createAsyncThunk('adminQuestions/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const question = await adminQuestionService.updateQuestion(id, payload);
    toast.success(`Question updated`);
    return question;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not update this question.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const deleteAdminQuestion = createAsyncThunk('adminQuestions/delete', async (id, { rejectWithValue }) => {
  try {
    const question = await adminQuestionService.deleteQuestion(id);
    toast.success(`Question deleted`);
    return question;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this question.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const restoreAdminQuestion = createAsyncThunk('adminQuestions/restore', async (id, { rejectWithValue }) => {
  try {
    const question = await adminQuestionService.restoreQuestion(id);
    toast.success(`Question restored`);
    return question;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not restore this question.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const adminQuestionsSlice = createSlice({
  name: 'adminQuestions',
  initialState: { questions: [], total: 0, page: 1, totalPages: 1, status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminQuestions.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAdminQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.questions = action.payload.questions;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchAdminQuestions.rejected, (state) => { state.status = 'failed'; })
      .addCase(createAdminQuestion.fulfilled, (state, action) => {
        state.questions.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateAdminQuestion.fulfilled, (state, action) => {
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.questions[idx] = action.payload;
      })
      .addCase(deleteAdminQuestion.fulfilled, (state, action) => {
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.questions[idx] = action.payload;
      })
      .addCase(restoreAdminQuestion.fulfilled, (state, action) => {
        const idx = state.questions.findIndex((q) => q._id === action.payload._id);
        if (idx !== -1) state.questions[idx] = action.payload;
      });
  },
});

export default adminQuestionsSlice.reducer;
