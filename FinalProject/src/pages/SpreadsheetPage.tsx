import { useCallback, useEffect, useState } from 'react';

import SpreadsheetTable from '@/components/SpreadsheetTable';
import { getDocumentById, updateDocumentData } from '@/services/documentService';
import { mockUser } from '@/services/mockUser';
import type { SpreadsheetDocument } from '@/types/document';
import type { TableData } from '@/types/spreadsheet';

type SpreadsheetPageProps = {
  documentId: string;
  onBack: () => void;
};

type SaveStatus = 'saved' | 'saving' | 'error';

function SpreadsheetPage({ documentId, onBack }: SpreadsheetPageProps) {
  const [document, setDocument] = useState<SpreadsheetDocument | null>(null);
  const [table, setTable] = useState<TableData | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const foundDocument = getDocumentById(documentId, mockUser.id);

    setDocument(foundDocument);

    if (foundDocument !== null) {
      setTable(foundDocument.data);
    }
  }, [documentId]);

  const saveDocumentNow = useCallback(() => {
    if (table === null) {
      return;
    }

    setSaveStatus('saving');

    try {
      const updatedDocument = updateDocumentData(documentId, mockUser.id, table);

      if (updatedDocument === null) {
        setSaveStatus('error');
        return;
      }

      setDocument(updatedDocument);
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch {
      setSaveStatus('error');
    }
  }, [documentId, table]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    setSaveStatus('saving');

    const timerId = window.setTimeout(() => {
      saveDocumentNow();
    }, 6000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasUnsavedChanges, table, saveDocumentNow]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveDocumentNow();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveDocumentNow]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  function handleTableChange(newTable: TableData) {
    setTable(newTable);
    setHasUnsavedChanges(true);
  }

  function getSaveStatusText(): string {
    if (saveStatus === 'saving') {
      return 'Сохранение...';
    }

    if (saveStatus === 'error') {
      return 'Ошибка сохранения';
    }

    return 'Сохранено';
  }

  function handleBackClick() {
    if (hasUnsavedChanges) {
      const isConfirmed = confirm('Есть несохранённые изменения. Выйти?');

      if (!isConfirmed) {
        return;
      }
    }

    onBack();
  }

  if (document === null || table === null) {
    return (
      <div className="spreadsheet-page">
        <button type="button" onClick={onBack}>
          Назад
        </button>

        <h1>Документ не найден</h1>
      </div>
    );
  }

  return (
    <div className="spreadsheet-page">
      <div className="spreadsheet-page-header">
        <div>
          <h1>{document.title}</h1>
          <p>
            Размер: {document.rows} × {document.cols}
          </p>
          <p className="save-status">{getSaveStatusText()}</p>
        </div>

        <div className="spreadsheet-page-actions">
          <button type="button" onClick={saveDocumentNow}>
            Сохранить
          </button>

          <button type="button" onClick={handleBackClick}>
            Назад к документам
          </button>
        </div>
      </div>

      <SpreadsheetTable initialTable={table} onTableChange={handleTableChange} />
    </div>
  );
}

export default SpreadsheetPage;