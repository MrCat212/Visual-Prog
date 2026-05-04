import { useEffect, useState } from 'react';

import { mockUser } from '@/services/mockUser';
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  getUserDocuments,
  renameDocument,
} from '@/services/documentService';
import type { SpreadsheetDocument } from '@/types/document';

type DashboardPageProps = {
    onOpenDocument: (documentId: string) => void;
  };

  function DashboardPage({ onOpenDocument }: DashboardPageProps) {
  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentRows, setNewDocumentRows] = useState(100);
  const [newDocumentCols, setNewDocumentCols] = useState(26);

  useEffect(() => {
    loadDocuments();
  }, []);

  function loadDocuments() {
    const userDocuments = getUserDocuments(mockUser.id);
    setDocuments(userDocuments);
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

    setNewDocumentTitle('');
    setNewDocumentRows(100);
    setNewDocumentCols(26);

    loadDocuments();
  }

  function handleRenameDocument(document: SpreadsheetDocument) {
    const newTitle = prompt('Введите новое название', document.title);

    if (newTitle === null) {
      return;
    }

    const preparedTitle = newTitle.trim();

    if (preparedTitle === '') {
      alert('Название не может быть пустым');
      return;
    }

    renameDocument(document.id, mockUser.id, preparedTitle);
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
      </div>

      <div className="create-document-block">
        <h2>Создать документ</h2>

        <div className="create-document-form">
          <input
            value={newDocumentTitle}
            placeholder="Название документа"
            onChange={(event) => setNewDocumentTitle(event.target.value)}
          />

          <input
            type="number"
            value={newDocumentRows}
            min={1}
            onChange={(event) => setNewDocumentRows(Number(event.target.value))}
          />

          <input
            type="number"
            value={newDocumentCols}
            min={1}
            onChange={(event) => setNewDocumentCols(Number(event.target.value))}
          />

          <button type="button" onClick={handleCreateDocument}>
            Создать
          </button>
        </div>
      </div>

      <div className="documents-list">
        {documents.length === 0 ? (
          <p>Документов пока нет</p>
        ) : (
          documents.map((document) => (
            <div className="document-card" key={document.id}>
              <div className="document-card-header">
                <div>
                  <h2>{document.title}</h2>
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

                  <button type="button" onClick={() => handleRenameDocument(document)}>
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
    </div>
  );
}

export default DashboardPage;