import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import SpreadsheetTable from '@/components/SpreadsheetTable';
import { getDocumentById, updateDocumentData } from '@/services/documentService';
import { mockUser } from '@/services/mockUser';
import type { SpreadsheetDocument } from '@/types/document';
import type { TableData } from '@/types/spreadsheet';
import {
  csvToTable,
  downloadTextFile,
  tableToCsv,
  tableToJson,
} from '@/utils/fileUtils';

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
  const [csvColumnNames, setCsvColumnNames] = useState<string[]>([]);

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

  function handleExportCsv() {
    if (document === null || table === null) {
      return;
    }

    const csv = tableToCsv(table);
    downloadTextFile(document.title + '.csv', csv, 'text/csv');
  }

  function handleExportJson() {
    if (document === null || table === null) {
      return;
    }

    const json = tableToJson(table);
    downloadTextFile(document.title + '.json', json, 'application/json');
  }

  function handleImportCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file === undefined) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        alert('Не получилось прочитать файл');
        return;
      }

      const importedTable = csvToTable(result);

      if (importedTable.length === 0) {
        alert('CSV файл пустой');
        return;
      }
      
      const firstLine = result.split('\n')[0];
      const importedColumnNames = firstLine.split(',');
      
      const preparedColumnNames: string[] = [];
      
      for (let i = 0; i < importedColumnNames.length; i++) {
        const name = importedColumnNames[i].trim();
      
        if (name !== '') {
          preparedColumnNames.push(name);
        }
      }
      
      setCsvColumnNames(preparedColumnNames);
      setTable(importedTable);
      setHasUnsavedChanges(true);
      
    };

    reader.readAsText(file);
    event.target.value = '';
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

          <button type="button" onClick={handleExportCsv}>
            CSV
          </button>

          <button type="button" onClick={handleExportJson}>
            JSON
          </button>

          <label className="import-button">
            Импорт CSV
            <input type="file" accept=".csv,text/csv" onChange={handleImportCsv} />
          </label>

          <button type="button" onClick={handleBackClick}>
            Назад к документам
          </button>
        </div>
      </div>
      {csvColumnNames.length > 0 && (
        <div className="csv-columns-info">
          <strong>Колонки из CSV:</strong> {csvColumnNames.join(', ')}
          </div>
)}

<SpreadsheetTable initialTable={table} onTableChange={handleTableChange} />
    </div>
  );
}

export default SpreadsheetPage;