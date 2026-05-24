import { configureStore } from '@reduxjs/toolkit';

import { autosaveMiddleware } from '@/app/autosaveMiddleware';
import authReducer from '@/features/auth/authSlice';
import documentsReducer from '@/features/documents/documentsSlice';
import spreadsheetReducer from '@/features/spreadsheet/spreadsheetSlice';
import uiReducer from '@/features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    spreadsheet: spreadsheetReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(autosaveMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
