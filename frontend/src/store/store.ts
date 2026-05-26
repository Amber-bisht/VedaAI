import { configureStore } from '@reduxjs/toolkit';
import assessmentFormReducer from './slices/assessmentFormSlice';
import assessmentResultReducer from './slices/assessmentResultSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    assessmentForm: assessmentFormReducer,
    assessmentResult: assessmentResultReducer,
    settings: settingsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false // Allow file uploads metadata in store
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
