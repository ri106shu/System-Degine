import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import progressService from '../../services/progressService';
import { notifyNewAchievements } from '../../utils/notifyAchievements';

const extractError = (err) => err.response?.data?.message || 'Something went wrong.';

export const fetchTopicProgress = createAsyncThunk(
  'progress/fetchTopics',
  async (_, { rejectWithValue }) => {
    try {
      return await progressService.getTopicProgress();
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const fetchQuestionProgress = createAsyncThunk(
  'progress/fetchQuestions',
  async (_, { rejectWithValue }) => {
    try {
      return await progressService.getQuestionProgress();
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const setTopicProgress = createAsyncThunk(
  'progress/setTopic',
  async ({ topicId, status, confidence }, { rejectWithValue }) => {
    try {
      const { progress, newAchievements } = await progressService.updateTopicProgress(topicId, { status, confidence });
      notifyNewAchievements(newAchievements);
      return { targetId: topicId, progress };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const setQuestionProgress = createAsyncThunk(
  'progress/setQuestion',
  async ({ questionId, status }, { rejectWithValue }) => {
    try {
      const { progress, newAchievements } = await progressService.updateQuestionProgress(questionId, { status });
      notifyNewAchievements(newAchievements);
      return { targetId: questionId, progress };
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const progressSlice = createSlice({
  name: 'progress',
  initialState: {
    topics: {}, // { [topicId]: { status, confidence, completedAt, ... } }
    questions: {}, // { [questionId]: { status, ... } }
    topicsStatus: 'idle',
    questionsStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopicProgress.pending, (state) => {
        state.topicsStatus = 'loading';
      })
      .addCase(fetchTopicProgress.fulfilled, (state, action) => {
        state.topicsStatus = 'succeeded';
        state.topics = action.payload.progress;
      })
      .addCase(fetchTopicProgress.rejected, (state, action) => {
        state.topicsStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(fetchQuestionProgress.pending, (state) => {
        state.questionsStatus = 'loading';
      })
      .addCase(fetchQuestionProgress.fulfilled, (state, action) => {
        state.questionsStatus = 'succeeded';
        state.questions = action.payload.progress;
      })
      .addCase(fetchQuestionProgress.rejected, (state, action) => {
        state.questionsStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(setTopicProgress.fulfilled, (state, action) => {
        state.topics[action.payload.targetId] = action.payload.progress;
      })
      .addCase(setQuestionProgress.fulfilled, (state, action) => {
        state.questions[action.payload.targetId] = action.payload.progress;
      });
  },
});

export default progressSlice.reducer;
