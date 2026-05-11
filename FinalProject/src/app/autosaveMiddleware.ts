import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store';
import {
  addColumn,
  addRow,
  changeCell,
  deleteColumn,
  deleteRow,
  redo,
  replaceTable,
  undo,
} from '@/features/spreadsheet/spreadsheetSlice';
import { setSaveStatus } from '@/features/ui/uiSlice';
import { updateDocumentData } from '@/services/documentService';

const AUTOSAVE_DELAY = 6000;

export const autosaveMiddleware = createListenerMiddleware();

let timerId: number | undefined;

autosaveMiddleware.startListening({
  matcher: isAnyOf(
    changeCell,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    undo,
    redo,
    replaceTable,
  ),

  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState() as RootState;

    const documentId = state.documents.activeDocumentId;
    const user = state.auth.user;

    if (documentId === null || user === null) {
      return;
    }

    listenerApi.dispatch(setSaveStatus('saving'));

    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }

    timerId = window.setTimeout(() => {
      const currentState = listenerApi.getState() as RootState;

      try {
        const updatedDocument = updateDocumentData(
          documentId,
          user.id,
          currentState.spreadsheet.table,
        );

        if (updatedDocument === null) {
          listenerApi.dispatch(setSaveStatus('error'));
          return;
        }

        listenerApi.dispatch(setSaveStatus('saved'));
      } catch {
        listenerApi.dispatch(setSaveStatus('error'));
      }

      timerId = undefined;
    }, AUTOSAVE_DELAY);
  },
});