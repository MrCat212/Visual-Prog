import { describe, expect, it } from 'vitest';

import uiReducer, {
  clearNotification,
  closeCreateDocumentModal,
  openCreateDocumentModal,
  setNotification,
  setSaveStatus,
} from '@/features/ui/uiSlice';

describe('uiSlice', () => {
  it('должен иметь начальное состояние', () => {
    const state = uiReducer(undefined, {
      type: 'unknown',
    });

    expect(state.saveStatus).toBe('saved');
    expect(state.notification).toBe(null);
    expect(state.isCreateDocumentModalOpen).toBe(false);
  });

  it('должен менять статус сохранения', () => {
    const state = uiReducer(undefined, setSaveStatus('saving'));

    expect(state.saveStatus).toBe('saving');
  });

  it('должен показывать и очищать уведомление', () => {
    const stateWithNotification = uiReducer(undefined, setNotification('Готово'));

    expect(stateWithNotification.notification).toBe('Готово');

    const stateWithoutNotification = uiReducer(stateWithNotification, clearNotification());

    expect(stateWithoutNotification.notification).toBe(null);
  });

  it('должен открывать и закрывать модальное окно создания документа', () => {
    const openedState = uiReducer(undefined, openCreateDocumentModal());

    expect(openedState.isCreateDocumentModalOpen).toBe(true);

    const closedState = uiReducer(openedState, closeCreateDocumentModal());

    expect(closedState.isCreateDocumentModalOpen).toBe(false);
  });
});