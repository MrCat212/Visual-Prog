import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import SpreadsheetTable from '@/components/SpreadsheetTable';
import { setActiveDocumentId } from '@/features/documents/documentsSlice';
import {
  replaceTable,
  setTable as setSpreadsheetTable,
} from '@/features/spreadsheet/spreadsheetSlice';
import { setSaveStatus } from '@/features/ui/uiSlice';
import { getDocumentById, updateDocumentData } from '@/services/documentService';
import {
  csvToTable,
  downloadTextFile,
  tableToCsv,
  tableToJson,
} from '@/utils/fileUtils';

type CsvInfo = {
  documentId: string;
  names: string[];
};

function SpreadsheetPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams();

  const documentId = params.documentId ?? '';

  const user = useAppSelector((state) => state.auth.user);
  const table = useAppSelector((state) => state.spreadsheet.table);
  const saveStatus = useAppSelector((state) => state.ui.saveStatus);

  const document = useMemo(() => {
    if (user === null) {
      return null;
    }

    return getDocumentById(documentId, user.id);
  }, [documentId, user]);

  const [csvInfo, setCsvInfo] = useState<CsvInfo>({
    documentId: '',
    names: [],
  });

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (saveStatus !== 'saving') {
      return false;
    }

    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    const isConfirmed = confirm('Документ ещё сохраняется. Выйти?');

    if (isConfirmed) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    dispatch(setSaveStatus('saved'));

    if (document !== null) {
      dispatch(setActiveDocumentId(documentId));
      dispatch(setSpreadsheetTable(document.data));
    } else {
      dispatch(setActiveDocumentId(null));
    }

    return () => {
      dispatch(setActiveDocumentId(null));
    };
  }, [dispatch, documentId, document]);

  const saveDocumentNow = useCallback(() => {
    if (document === null || user === null) {
      return;
    }

    dispatch(setSaveStatus('saving'));

    try {
      const updatedDocument = updateDocumentData(documentId, user.id, table);

      if (updatedDocument === null) {
        dispatch(setSaveStatus('error'));
        return;
      }

      dispatch(setSaveStatus('saved'));
    } catch {
      dispatch(setSaveStatus('error'));
    }
  }, [dispatch, document, documentId, table, user]);

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

      setCsvInfo({
        documentId,
        names: preparedColumnNames,
      });

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
    navigate('/dashboard');
  }

  if (user === null) {
    return (
      <div className="spreadsheet-page">
        <h2>Пользователь не найден</h2>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="spreadsheet-page">
        <div className="breadcrumbs">
          <Link to="/dashboard">Мои документы</Link>
          <span> → </span>
          <span>Документ не найден</span>
        </div>

        <h2>Документ не найден</h2>
        <p>Возможно, он был удалён, ссылка неправильная или документ принадлежит другому пользователю.</p>

        <button type="button" onClick={() => navigate('/dashboard')}>
          Вернуться к документам
        </button>
      </div>
    );
  }

  const shouldShowCsvColumns = csvInfo.documentId === documentId && csvInfo.names.length > 0;

  return (
    <div className="spreadsheet-page">
      <div className="breadcrumbs">
        <Link to="/dashboard">Мои документы</Link>
        <span> → </span>
        <span>{document.title}</span>
      </div>

      <div className="spreadsheet-page-header">
        <div>
          <h2>{document.title}</h2>
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

      {shouldShowCsvColumns && (
        <div className="csv-columns-info">
          <strong>Колонки из CSV:</strong> {csvInfo.names.join(', ')}
        </div>
      )}

      <SpreadsheetTable />
    </div>
  );
}

export default SpreadsheetPage;