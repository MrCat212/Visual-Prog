import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type SaveStatus = 'saved' | 'saving' | 'error';

type UiState = {
  saveStatus: SaveStatus;
  notification: string | null;
  isCreateDocumentModalOpen: boolean;
};

const initialState: UiState = {
  saveStatus: 'saved',
  notification: null,
  isCreateDocumentModalOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSaveStatus(state, action: PayloadAction<SaveStatus>) {
      state.saveStatus = action.payload;
    },

    setNotification(state, action: PayloadAction<string>) {
      state.notification = action.payload;
    },

    clearNotification(state) {
      state.notification = null;
    },

    openCreateDocumentModal(state) {
      state.isCreateDocumentModalOpen = true;
    },

    closeCreateDocumentModal(state) {
      state.isCreateDocumentModalOpen = false;
    },
  },
});

export const {
  setSaveStatus,
  setNotification,
  clearNotification,
  openCreateDocumentModal,
  closeCreateDocumentModal,
} = uiSlice.actions;

export default uiSlice.reducer;