import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  createUserDocument,
  deleteUserDocument,
  duplicateUserDocument,
  loadUserDocuments,
  renameUserDocument,
} from '@/features/documents/documentsSlice';
import { closeCreateDocumentModal, openCreateDocumentModal } from '@/features/ui/uiSlice';
import type { SpreadsheetDocument } from '@/types/document';

function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);
  const documents = useAppSelector((state) => state.documents.documents);
  const isLoading = useAppSelector((state) => state.documents.isLoading);
  const error = useAppSelector((state) => state.documents.error);
  const isCreateModalOpen = useAppSelector((state) => state.ui.isCreateDocumentModalOpen);

  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentRows, setNewDocumentRows] = useState(100);
  const [newDocumentCols, setNewDocumentCols] = useState(26);

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (user !== null) {
      dispatch(loadUserDocuments(user.id));
    }
  }, [dispatch, user]);

  function openModal() {
    setNewDocumentTitle('');
    setNewDocumentRows(100);
    setNewDocumentCols(26);
    dispatch(openCreateDocumentModal());
  }

  function closeModal() {
    dispatch(closeCreateDocumentModal());
  }

  function handleCreateDocument() {
    if (user === null) {
      return;
    }

    const title = newDocumentTitle.trim();

    if (title === '') {
      alert('Введите название документа');
      return;
    }

    if (newDocumentRows <= 0 || newDocumentCols <= 0) {
      alert('Размер таблицы должен быть больше 0');
      return;
    }

    dispatch(
      createUserDocument({
        userId: user.id,
        title,
        rows: newDocumentRows,
        cols: newDocumentCols,
      }),
    );

    closeModal();
  }

  function startRenameDocument(document: SpreadsheetDocument) {
    setEditingDocumentId(document.id);
    setEditingTitle(document.title);
  }

  function cancelRenameDocument() {
    setEditingDocumentId(null);
    setEditingTitle('');
  }

  function saveRenameDocument(document: SpreadsheetDocument) {
    if (user === null) {
      return;
    }

    const title = editingTitle.trim();

    if (title === '') {
      alert('Название не может быть пустым');
      return;
    }

    dispatch(
      renameUserDocument({
        documentId: document.id,
        userId: user.id,
        title,
      }),
    );

    setEditingDocumentId(null);
    setEditingTitle('');
  }

  function handleDeleteDocument(document: SpreadsheetDocument) {
    if (user === null) {
      return;
    }

    const isConfirmed = confirm(`Удалить документ "${document.title}"?`);

    if (!isConfirmed) {
      return;
    }

    dispatch(
      deleteUserDocument({
        documentId: document.id,
        userId: user.id,
      }),
    );
  }

  function handleDuplicateDocument(document: SpreadsheetDocument) {
    if (user === null) {
      return;
    }

    dispatch(
      duplicateUserDocument({
        documentId: document.id,
        userId: user.id,
      }),
    );
  }

  function handleOpenDocument(documentId: string) {
    navigate(`/documents/${documentId}`);
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString('ru-RU');
  }

  if (user === null) {
    return (
      <div className="dashboard-page">
        <h2>Пользователь не найден</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p>
            Пользователь: {user.name} ({user.email})
          </p>
        </div>

        <button type="button" onClick={openModal}>
          Создать документ
        </button>
      </div>

      {isLoading && <p>Загрузка документов...</p>}

      {error !== null && <p>{error}</p>}

      <div className="documents-list">
        {documents.length === 0 ? (
          <p>Документов пока нет</p>
        ) : (
          documents.map((document) => (
            <div className="document-card" key={document.id}>
              <div className="document-card-header">
                <div>
                  {editingDocumentId === document.id ? (
                    <div className="rename-form">
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                      />

                      <button type="button" onClick={() => saveRenameDocument(document)}>
                        Сохранить
                      </button>

                      <button type="button" onClick={cancelRenameDocument}>
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <h2>{document.title}</h2>
                  )}

                  <p>Создан: {formatDate(document.createdAt)}</p>
                  <p>Изменён: {formatDate(document.updatedAt)}</p>
                  <p>
                    Размер: {document.rows} × {document.cols}
                  </p>
                </div>

                <div className="document-actions">
                  <button type="button" onClick={() => handleOpenDocument(document.id)}>
                    Открыть
                  </button>

                  <button type="button" onClick={() => startRenameDocument(document)}>
                    Переименовать
                  </button>

                  <button type="button" onClick={() => handleDuplicateDocument(document)}>
                    Дублировать
                  </button>

                  <button type="button" onClick={() => handleDeleteDocument(document)}>
                    Удалить
                  </button>
                </div>
              </div>

              <div className="document-preview">
                {document.data.slice(0, 3).map((row, rowIndex) => (
                  <div className="preview-row" key={rowIndex}>
                    {row.slice(0, 3).map((cell, colIndex) => (
                      <div className="preview-cell" key={colIndex}>
                        {cell.result || cell.value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <h2>Создать документ</h2>

            <label>
              Название
              <input
                value={newDocumentTitle}
                placeholder="Например: Таблица 1"
                onChange={(event) => setNewDocumentTitle(event.target.value)}
              />
            </label>

            <label>
              Количество строк
              <input
                type="number"
                value={newDocumentRows}
                min={1}
                onChange={(event) => setNewDocumentRows(Number(event.target.value))}
              />
            </label>

            <label>
              Количество столбцов
              <input
                type="number"
                value={newDocumentCols}
                min={1}
                onChange={(event) => setNewDocumentCols(Number(event.target.value))}
              />
            </label>

            <div className="modal-actions">
              <button type="button" onClick={handleCreateDocument}>
                Создать
              </button>

              <button type="button" onClick={closeModal}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
