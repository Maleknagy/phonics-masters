import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mbmswkltiqepwcynwgfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibXN3a2x0aXFlcHdjeW53Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzAzNzgsImV4cCI6MjA4MzMwNjM3OH0.fVB4f7KIoDdznFgnQ9ZDjr7W4fxk2dJpmu_fStPZ6_s';
const supabase = createClient(supabaseUrl, supabaseKey);

// Async Thunk to Fetch All Levels
export const getAllLevels = createAsyncThunk(
  'levels/getAll',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch levels and sort by level_number (1, 2, 3, 4...)
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level_number', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const levelSlice = createSlice({
  name: 'levels',
  initialState: {
    levels: [], // Default to empty array
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllLevels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllLevels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.levels = action.payload; // Store the fetched levels
      })
      .addCase(getAllLevels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default levelSlice.reducer;