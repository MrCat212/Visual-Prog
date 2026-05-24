import { describe, expect, it } from 'vitest';

import documentsReducer, {
  createUserDocument,
  deleteUserDocument,
  duplicateUserDocument,
  loadUserDocuments,
  renameUserDocument,
  setActiveDocumentId,
} from '@/features/documents/documentsSlice';

describe('documentsSlice', () => {
  it('должен иметь начальное состояние', () => {
    const state = documentsReducer(undefined, {
      type: 'unknown',
    });

    expect(state.documents).toEqual([]);
    expect(state.activeDocumentId).toBe(null);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('должен устанавливать активный документ', () => {
    const state = documentsReducer(undefined, setActiveDocumentId('doc-1'));

    expect(state.activeDocumentId).toBe('doc-1');
  });

  it('должен начинать загрузку документов', () => {
    const state = documentsReducer(undefined, {
      type: loadUserDocuments.pending.type,
    });

    expect(state.isLoading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('должен сохранять загруженные документы', () => {
    const document = {
      id: 'doc-1',
      userId: 'user-1',
      title: 'Документ 1',
      rows: 10,
      cols: 5,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      data: [],
    };

    const state = documentsReducer(undefined, {
      type: loadUserDocuments.fulfilled.type,
      payload: [document],
    });

    expect(state.documents.length).toBe(1);
    expect(state.documents[0].title).toBe('Документ 1');
    expect(state.isLoading).toBe(false);
  });

  it('должен записывать ошибку загрузки', () => {
    const state = documentsReducer(undefined, {
      type: loadUserDocuments.rejected.type,
    });

    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Не удалось загрузить документы');
  });

  it('должен добавлять созданный документ', () => {
    const document = {
      id: 'doc-1',
      userId: 'user-1',
      title: 'Новый документ',
      rows: 10,
      cols: 5,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      data: [],
    };

    const state = documentsReducer(undefined, {
      type: createUserDocument.fulfilled.type,
      payload: document,
    });

    expect(state.documents.length).toBe(1);
    expect(state.documents[0].title).toBe('Новый документ');
  });

  it('должен переименовывать документ', () => {
    const oldDocument = {
      id: 'doc-1',
      userId: 'user-1',
      title: 'Старое название',
      rows: 10,
      cols: 5,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      data: [],
    };

    const newDocument = {
      ...oldDocument,
      title: 'Новое название',
    };

    const stateWithDocument = documentsReducer(undefined, {
      type: createUserDocument.fulfilled.type,
      payload: oldDocument,
    });

    const state = documentsReducer(stateWithDocument, {
      type: renameUserDocument.fulfilled.type,
      payload: newDocument,
    });

    expect(state.documents[0].title).toBe('Новое название');
  });

  it('должен удалять документ', () => {
    const document = {
      id: 'doc-1',
      userId: 'user-1',
      title: 'Документ',
      rows: 10,
      cols: 5,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      data: [],
    };

    const stateWithDocument = documentsReducer(undefined, {
      type: createUserDocument.fulfilled.type,
      payload: document,
    });

    const state = documentsReducer(stateWithDocument, {
      type: deleteUserDocument.fulfilled.type,
      payload: 'doc-1',
    });

    expect(state.documents.length).toBe(0);
  });

  it('должен дублировать документ', () => {
    const document = {
      id: 'doc-1',
      userId: 'user-1',
      title: 'Документ',
      rows: 10,
      cols: 5,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      data: [],
    };

    const copy = {
      ...document,
      id: 'doc-2',
      title: 'Документ копия',
    };

    const stateWithDocument = documentsReducer(undefined, {
      type: createUserDocument.fulfilled.type,
      payload: document,
    });

    const state = documentsReducer(stateWithDocument, {
      type: duplicateUserDocument.fulfilled.type,
      payload: copy,
    });

    expect(state.documents.length).toBe(2);
    expect(state.documents[1].title).toBe('Документ копия');
  });
});
