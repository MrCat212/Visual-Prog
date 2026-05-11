import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import SpreadsheetTable from '@/components/SpreadsheetTable';
import {
  replaceTable,
  setTable as setSpreadsheetTable,
} from '@/features/spreadsheet/spreadsheetSlice';
import { setSaveStatus } from '@/features/ui/uiSlice';
import { getDocumentById, updateDocumentData } from '@/services/documentService';
import { mockUser } from '@/services/mockUser';
import type { SpreadsheetDocument } from '@/types/document';
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

function SpreadsheetPage({ documentId, onBack }: SpreadsheetPageProps) {
  const dispatch = useAppDispatch();

  const table = useAppSelector((state) => state.spreadsheet.table);
  const saveStatus = useAppSelector((state) => state.ui.saveStatus);

  const [document, setDocument] = useState<SpreadsheetDocument | null>(() =>
    getDocumentById(documentId, mockUser.id),
  );
  const [csvColumnNames, setCsvColumnNames] = useState<string[]>([]);

  useEffect(() => {
    dispatch(setSaveStatus('saved'));

    if (document !== null) {
      dispatch(setSpreadsheetTable(document.data));
    }
  }, [dispatch, document]);

  const saveDocumentNow = useCallback(() => {
    if (document === null) {
      return;
    }

    dispatch(setSaveStatus('saving'));

    try {
      const updatedDocument = updateDocumentData(documentId, mockUser.id, table);

      if (updatedDocument === null) {
        dispatch(setSaveStatus('error'));
        return;
      }

      setDocument(updatedDocument);
      dispatch(setSaveStatus('saved'));
    } catch {
      dispatch(setSaveStatus('error'));
    }
  }, [dispatch, document, documentId, table]);

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
      if (saveStatus !== 'saving') {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveStatus]);

  function handleExportCsv() {
    if (document === null) {
      return;
    }

    const csv = tableToCsv(table);
    downloadTextFile(document.title + '.csv', csv, 'text/csv');
  }

  function handleExportJson() {
    if (document === null) {
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
      dispatch(replaceTable(importedTable));
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
    if (saveStatus === 'saving') {
      const isConfirmed = confirm('Документ ещё сохраняется. Выйти?');

      if (!isConfirmed) {
        return;
      }
    }

    onBack();
  }

  if (document === null) {
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
            Размер: {table.length} × {table[0]?.length ?? 0}
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

      <SpreadsheetTable />
    </div>
  );
}

export default SpreadsheetPage;