import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import mockService from '../../services/mockService';
import { notifyNewAchievements } from '../../utils/notifyAchievements';

export const fetchEligible = createAsyncThunk('mock/fetchEligible', async ({ mode, type }, { rejectWithValue }) => {
  try {
    return await mockService.getEligible(mode, type);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load eligible content.');
  }
});

export const createMock = createAsyncThunk('mock/create', async (config, { rejectWithValue }) => {
  try {
    return await mockService.createMock(config);
  } catch (err) {
    const message = err.response?.data?.message || 'Could not create the mock interview.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

// --- Live session ---

export const fetchSession = createAsyncThunk('mock/fetchSession', async (id, { rejectWithValue }) => {
  try {
    return await mockService.getMockById(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this interview session.');
  }
});

export const submitAnswer = createAsyncThunk('mock/submitAnswer', async ({ id, questionIndex, answer, timeSpentSeconds }, { rejectWithValue }) => {
  try {
    return await mockService.submitAnswer(id, { questionIndex, answer, timeSpentSeconds });
  } catch (err) {
    const message = err.response?.data?.message || 'Could not save your answer.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const navigateToQuestion = createAsyncThunk('mock/navigate', async ({ id, questionIndex }, { rejectWithValue }) => {
  try {
    return await mockService.navigateToQuestion(id, questionIndex);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not move to that question.');
  }
});

export const finishMock = createAsyncThunk('mock/finish', async ({ id, questionIndex, answer, timeSpentSeconds }, { rejectWithValue }) => {
  try {
    const { mock, newAchievements } = await mockService.finishMock(id, { questionIndex, answer, timeSpentSeconds });
    notifyNewAchievements(newAchievements);
    return mock;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not finish the interview.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const abandonMock = createAsyncThunk('mock/abandon', async (id, { rejectWithValue }) => {
  try {
    return await mockService.abandonMock(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not leave the interview.');
  }
});

// --- History ---

export const fetchHistory = createAsyncThunk('mock/fetchHistory', async (params, { rejectWithValue }) => {
  try {
    return await mockService.getMockHistory(params);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load mock interview history.');
  }
});

// Separate from fetchHistory/`history` on purpose — this checks for a
// resumable session on the Mock Interview page, and must not share a Redux
// slot with MockHistoryPage's own paginated, filtered list, or the two
// pages would silently overwrite each other's data.
export const fetchInProgressMock = createAsyncThunk('mock/fetchInProgressMock', async (_, { rejectWithValue }) => {
  try {
    const result = await mockService.getMockHistory({ status: 'in_progress', limit: 1 });
    return result.mocks[0] || null;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const fetchHistoryDetail = createAsyncThunk('mock/fetchHistoryDetail', async (id, { rejectWithValue }) => {
  try {
    return await mockService.getMockById(id);
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load this interview.');
  }
});

export const deleteMock = createAsyncThunk('mock/delete', async (id, { rejectWithValue }) => {
  try {
    await mockService.deleteMock(id);
    toast.success('Mock interview deleted');
    return id;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not delete this mock interview.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const mockSlice = createSlice({
  name: 'mock',
  initialState: {
    // Shape depends on the last-fetched type:
    // topic:    { mode, type, completedTopics, eligibleTopics, topics }
    // question: { mode, type, completedTopics, eligibleQuestions, questions }
    eligible: null,
    eligibleStatus: 'idle',
    createdMock: null,
    createStatus: 'idle',

    // The one live session currently being taken (a full MockInterview doc).
    session: null,
    sessionStatus: 'idle',
    sessionError: null,

    // A dedicated slot, not the shared history list — see fetchInProgressMock.
    inProgressMock: null,
    inProgressMockStatus: 'idle',

    // Mock History: paginated list + one detail record.
    history: [],
    historyTotal: 0,
    historyPage: 1,
    historyTotalPages: 1,
    historyStatus: 'idle',
    historyDetail: null,
    historyDetailStatus: 'idle',
  },
  reducers: {
    clearCreatedMock: (state) => {
      state.createdMock = null;
      state.createStatus = 'idle';
    },
    clearSession: (state) => {
      state.session = null;
      state.sessionStatus = 'idle';
      state.sessionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEligible.pending, (state) => {
        state.eligibleStatus = 'loading';
      })
      .addCase(fetchEligible.fulfilled, (state, action) => {
        state.eligibleStatus = 'succeeded';
        state.eligible = action.payload;
      })
      .addCase(fetchEligible.rejected, (state) => {
        state.eligibleStatus = 'failed';
      })
      .addCase(createMock.pending, (state) => {
        state.createStatus = 'loading';
      })
      .addCase(createMock.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.createdMock = action.payload;
        state.session = action.payload; // a freshly created mock IS the session, ready to take immediately
      })
      .addCase(createMock.rejected, (state) => {
        state.createStatus = 'failed';
      })

      .addCase(fetchSession.pending, (state) => {
        state.sessionStatus = 'loading';
        state.sessionError = null;
      })
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.sessionStatus = 'succeeded';
        state.session = action.payload;
      })
      .addCase(fetchSession.rejected, (state, action) => {
        state.sessionStatus = 'failed';
        state.sessionError = action.payload;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(navigateToQuestion.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(finishMock.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(fetchInProgressMock.pending, (state) => {
        state.inProgressMockStatus = 'loading';
      })
      .addCase(fetchInProgressMock.fulfilled, (state, action) => {
        state.inProgressMockStatus = 'succeeded';
        state.inProgressMock = action.payload;
      })
      .addCase(fetchInProgressMock.rejected, (state) => {
        state.inProgressMockStatus = 'failed';
      })
      .addCase(abandonMock.fulfilled, (state, action) => {
        state.session = action.payload;
        if (state.inProgressMock && state.inProgressMock._id === action.payload._id) {
          state.inProgressMock = null;
        }
      })

      .addCase(fetchHistory.pending, (state) => {
        state.historyStatus = 'loading';
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded';
        state.history = action.payload.mocks;
        state.historyTotal = action.payload.total;
        state.historyPage = action.payload.page;
        state.historyTotalPages = action.payload.totalPages;
      })
      .addCase(fetchHistory.rejected, (state) => {
        state.historyStatus = 'failed';
      })
      .addCase(fetchHistoryDetail.pending, (state) => {
        state.historyDetailStatus = 'loading';
      })
      .addCase(fetchHistoryDetail.fulfilled, (state, action) => {
        state.historyDetailStatus = 'succeeded';
        state.historyDetail = action.payload;
      })
      .addCase(fetchHistoryDetail.rejected, (state) => {
        state.historyDetailStatus = 'failed';
      })
      .addCase(deleteMock.fulfilled, (state, action) => {
        state.history = state.history.filter((m) => m._id !== action.payload);
        state.historyTotal = Math.max(0, state.historyTotal - 1);
      });
  },
});

export const { clearCreatedMock, clearSession } = mockSlice.actions;
export default mockSlice.reducer;
