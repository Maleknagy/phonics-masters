import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../utils/axios';

// Get user stats
export const getStats = createAsyncThunk(
  'progress/getStats',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await axios.get('/progress/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update activity progress
export const updateActivityProgress = createAsyncThunk(
  'progress/updateActivityProgress',
  async (progressData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await axios.post('/progress/activity', progressData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get user progress for specific unit
export const getUnitProgress = createAsyncThunk(
  'progress/getUnitProgress',
  async (unitId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/progress/unit/${unitId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get all user progress
export const getAllProgress = createAsyncThunk(
  'progress/getAllProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/progress');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const initialState = {
  stats: {
    totalStars: 0,
    totalPoints: 0,
    totalUnitsCompleted: 0,
    currentLevel: 1,
    currentUnit: 1
  },
  userProgress: [],
  unitProgress: null,
  isLoading: false,
  error: null
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearProgressError: (state) => {
      state.error = null;
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    // Get Stats
    builder
      .addCase(getStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(getStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Activity Progress
    builder
      .addCase(updateActivityProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateActivityProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.stats;
      })
      .addCase(updateActivityProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Unit Progress
    builder
      .addCase(getUnitProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUnitProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.unitProgress = action.payload.progress;
      })
      .addCase(getUnitProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get All Progress
    builder
      .addCase(getAllProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userProgress = action.payload.progress;
      })
      .addCase(getAllProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearProgressError, updateStats } = progressSlice.actions;
export default progressSlice.reducer;
