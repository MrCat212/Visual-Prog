import { useEffect, useState } from 'react';

import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  getUserDocuments,
  renameDocument,
} from '@/services/documentService';
import { mockUser } from '@/services/mockUser';
import type { SpreadsheetDocument } from '@/types/document';

type DashboardPageProps = {
  onOpenDocument: (documentId: string) => void;
};

function DashboardPage({ onOpenDocument }: DashboardPageProps) {
  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentRows, setNewDocumentRows] = useState(100);
  const [newDocumentCols, setNewDocumentCols] = useState(26);

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  function loadDocuments() {
    const userDocuments = getUserDocuments(mockUser.id);
    setDocuments(userDocuments);
  }

  function openCreateModal() {
    setNewDocumentTitle('');
    setNewDocumentRows(100);
    setNewDocumentCols(26);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
  }

  function handleCreateDocument() {
    const title = newDocumentTitle.trim();

    if (title === '') {
      alert('Введите название документа');
      return;
    }

    if (newDocumentRows <= 0 || newDocumentCols <= 0) {
      alert('Размер таблицы должен быть больше 0');
      return;
    }

    createDocument(mockUser.id, {
      title,
      rows: newDocumentRows,
      cols: newDocumentCols,
    });

    closeCreateModal();
    loadDocuments();
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
    const title = editingTitle.trim();

    if (title === '') {
      alert('Название не может быть пустым');
      return;
    }

    renameDocument(document.id, mockUser.id, title);
    setEditingDocumentId(null);
    setEditingTitle('');
    loadDocuments();
  }

  function handleDeleteDocument(document: SpreadsheetDocument) {
    const isConfirmed = confirm(`Удалить документ "${document.title}"?`);

    if (!isConfirmed) {
      return;
    }

    deleteDocument(document.id, mockUser.id);
    loadDocuments();
  }

  function handleDuplicateDocument(document: SpreadsheetDocument) {
    duplicateDocument(document.id, mockUser.id);
    loadDocuments();
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleString('ru-RU');
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Мои документы</h1>
          <p>
            Пользователь: {mockUser.name} ({mockUser.email})
          </p>
        </div>

        <button type="button" onClick={openCreateModal}>
          Создать документ
        </button>
      </div>

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
                  <button type="button" onClick={() => onOpenDocument(document.id)}>
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

              <button type="button" onClick={closeCreateModal}>
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
