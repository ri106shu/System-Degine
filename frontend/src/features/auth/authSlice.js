import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

const extractErrorMessage = (err) =>
  err.response?.data?.message || 'Something went wrong. Please try again.';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.login(payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

// Fired once on app load to check for an existing httpOnly-cookie session.
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

const initialState = {
  user: null,
  status: 'idle', // idle | loading | succeeded | failed
  initializing: true, // true until the initial session check resolves
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      })

      .addCase(fetchCurrentUser.pending, (state) => {
        state.initializing = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.initializing = false;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.initializing = false;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
