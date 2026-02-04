import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import levelReducer from './slices/levelSlice';
import progressReducer from './slices/progressSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    levels: levelReducer,
    progress: progressReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
