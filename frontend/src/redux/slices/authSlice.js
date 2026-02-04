import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db as supabase } from '../../supabaseClient';

// LOGIN THUNK
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// NEW: REGISTER THUNK
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, childName }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { childName, role: 'student' } // Saving the child's name in metadata
        }
      });
      if (error) throw error;
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('user'),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      supabase.auth.signOut();
    },
    loadUserFromStorage: (state) => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        state.user = JSON.parse(storedUser);
        state.isAuthenticated = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login Cases
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register Cases
      .addCase(registerUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        // Note: Supabase might require email confirmation before isAuthenticated becomes true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, loadUserFromStorage } = authSlice.actions;
export default authSlice.reducer;