import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  settings: null,
  loading: false,
  error: null
};

export const fetchPublicSettings = createAsyncThunk(
  'settings/fetchPublicSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/settings/public');
      if (response && response.success) {
        return response.settings;
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchPublicSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch settings';
      });
  }
});

export default settingsSlice.reducer;
