import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'interviewforge-theme';

// Theme preference is NOT sensitive, unlike the auth token, so localStorage
// is the right (and only) place for it — it just remembers a UI choice.
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: getInitialTheme() },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, state.mode);
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
      window.localStorage.setItem(STORAGE_KEY, state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
