import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import adminSettingsService from '../../services/adminSettingsService';

export const fetchAdminSettings = createAsyncThunk('adminSettings/fetch', async (_, { rejectWithValue }) => {
  try {
    return await adminSettingsService.getSettings();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load settings.');
  }
});

export const updatePlatformSettings = createAsyncThunk('adminSettings/updatePlatform', async (payload, { rejectWithValue }) => {
  try {
    const settings = await adminSettingsService.updatePlatform(payload);
    toast.success('Platform settings updated');
    return settings;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not save platform settings.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

export const updateModuleSettings = createAsyncThunk('adminSettings/updateModules', async (payload, { rejectWithValue }) => {
  try {
    const settings = await adminSettingsService.updateModules(payload);
    toast.success('Module availability updated');
    return settings;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not update module availability.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

// Field-level errors (e.g. "Current password is incorrect") come back as an
// `errors` array from the validator/service layer, same shape the rest of
// this app's forms already use — propagated through rejectWithValue rather
// than flattened into a single toast, so the form can show it inline next
// to the actual field instead of a generic banner.
export const changeAdminPassword = createAsyncThunk('adminSettings/changePassword', async (payload, { rejectWithValue }) => {
  try {
    await adminSettingsService.changePassword(payload);
    toast.success('Password changed successfully');
    return true;
  } catch (err) {
    const errors = err.response?.data?.errors;
    const message = err.response?.data?.message || 'Could not change password.';
    if (!errors) toast.error(message);
    return rejectWithValue({ message, errors });
  }
});

export const fetchDatabaseStats = createAsyncThunk('adminSettings/fetchDatabaseStats', async (_, { rejectWithValue }) => {
  try {
    return await adminSettingsService.getDatabaseStats();
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load database statistics.');
  }
});

export const resetAdminSettings = createAsyncThunk('adminSettings/reset', async (_, { rejectWithValue }) => {
  try {
    const settings = await adminSettingsService.resetSettings();
    toast.success('Settings reset to defaults');
    return settings;
  } catch (err) {
    const message = err.response?.data?.message || 'Could not reset settings.';
    toast.error(message);
    return rejectWithValue(message);
  }
});

const adminSettingsSlice = createSlice({
  name: 'adminSettings',
  initialState: {
    settings: null,
    status: 'idle',
    saveStatus: 'idle',
    moduleSaveStatus: 'idle',
    passwordStatus: 'idle',
    passwordErrors: null,
    dbStats: null,
    dbStatsStatus: 'idle',
  },
  reducers: {
    clearPasswordErrors: (state) => {
      state.passwordErrors = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(fetchAdminSettings.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(updatePlatformSettings.pending, (state) => {
        state.saveStatus = 'loading';
      })
      .addCase(updatePlatformSettings.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(updatePlatformSettings.rejected, (state) => {
        state.saveStatus = 'failed';
      })
      .addCase(updateModuleSettings.pending, (state) => {
        state.moduleSaveStatus = 'loading';
      })
      .addCase(updateModuleSettings.fulfilled, (state, action) => {
        state.moduleSaveStatus = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(updateModuleSettings.rejected, (state) => {
        state.moduleSaveStatus = 'failed';
      })
      .addCase(changeAdminPassword.pending, (state) => {
        state.passwordStatus = 'loading';
        state.passwordErrors = null;
      })
      .addCase(changeAdminPassword.fulfilled, (state) => {
        state.passwordStatus = 'succeeded';
        state.passwordErrors = null;
      })
      .addCase(changeAdminPassword.rejected, (state, action) => {
        state.passwordStatus = 'failed';
        state.passwordErrors = action.payload?.errors || null;
      })
      .addCase(fetchDatabaseStats.pending, (state) => {
        state.dbStatsStatus = 'loading';
      })
      .addCase(fetchDatabaseStats.fulfilled, (state, action) => {
        state.dbStatsStatus = 'succeeded';
        state.dbStats = action.payload;
      })
      .addCase(fetchDatabaseStats.rejected, (state) => {
        state.dbStatsStatus = 'failed';
      })
      .addCase(resetAdminSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { clearPasswordErrors } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;
