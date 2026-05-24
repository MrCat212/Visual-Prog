import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  getUserDocuments,
  renameDocument,
} from '@/services/documentService';
import type { SpreadsheetDocument } from '@/types/document';

type DocumentsState = {
  documents: SpreadsheetDocument[];
  activeDocumentId: string | null;
  isLoading: boolean;
  error: string | null;
};

type CreateDocumentPayload = {
  userId: string;
  title: string;
  rows: number;
  cols: number;
};

type RenameDocumentPayload = {
  documentId: string;
  userId: string;
  title: string;
};

type DeleteDocumentPayload = {
  documentId: string;
  userId: string;
};

type DuplicateDocumentPayload = {
  documentId: string;
  userId: string;
};

const initialState: DocumentsState = {
  documents: [],
  activeDocumentId: null,
  isLoading: false,
  error: null,
};

export const loadUserDocuments = createAsyncThunk(
  'documents/loadUserDocuments',
  async (userId: string) => {
    return getUserDocuments(userId);
  },
);

export const createUserDocument = createAsyncThunk(
  'documents/createUserDocument',
  async (payload: CreateDocumentPayload) => {
    return createDocument(payload.userId, {
      title: payload.title,
      rows: payload.rows,
      cols: payload.cols,
    });
  },
);

export const renameUserDocument = createAsyncThunk(
  'documents/renameUserDocument',
  async (payload: RenameDocumentPayload) => {
    return renameDocument(payload.documentId, payload.userId, payload.title);
  },
);

export const deleteUserDocument = createAsyncThunk(
  'documents/deleteUserDocument',
  async (payload: DeleteDocumentPayload) => {
    deleteDocument(payload.documentId, payload.userId);
    return payload.documentId;
  },
);

export const duplicateUserDocument = createAsyncThunk(
  'documents/duplicateUserDocument',
  async (payload: DuplicateDocumentPayload) => {
    return duplicateDocument(payload.documentId, payload.userId);
  },
);

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setActiveDocumentId(state, action: PayloadAction<string | null>) {
      state.activeDocumentId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserDocuments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(loadUserDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
        state.isLoading = false;
      })

      .addCase(loadUserDocuments.rejected, (state) => {
        state.isLoading = false;
        state.error = 'Не удалось загрузить документы';
      })

      .addCase(createUserDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload);
      })

      .addCase(renameUserDocument.fulfilled, (state, action) => {
        if (action.payload === null) {
          return;
        }

        for (let i = 0; i < state.documents.length; i++) {
          if (state.documents[i].id === action.payload.id) {
            state.documents[i] = action.payload;
          }
        }
      })

      .addCase(deleteUserDocument.fulfilled, (state, action) => {
        const newDocuments: SpreadsheetDocument[] = [];

        for (let i = 0; i < state.documents.length; i++) {
          if (state.documents[i].id !== action.payload) {
            newDocuments.push(state.documents[i]);
          }
        }

        state.documents = newDocuments;
      })

      .addCase(duplicateUserDocument.fulfilled, (state, action) => {
        if (action.payload !== null) {
          state.documents.push(action.payload);
        }
      });
  },
});

export const { setActiveDocumentId } = documentsSlice.actions;

export default documentsSlice.reducer;
