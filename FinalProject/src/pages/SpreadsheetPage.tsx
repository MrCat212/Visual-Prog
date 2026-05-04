import { useEffect, useState } from 'react';

import SpreadsheetTable from '@/components/SpreadsheetTable';
import { mockUser } from '@/services/mockUser';
import { getDocumentById, updateDocumentData } from '@/services/documentService';
import type { SpreadsheetDocument } from '@/types/document';
import type { TableData } from '@/types/spreadsheet';

type SpreadsheetPageProps = {
  documentId: string;
  onBack: () => void;
};

function SpreadsheetPage({ documentId, onBack }: SpreadsheetPageProps) {
  const [document, setDocument] = useState<SpreadsheetDocument | null>(null);

  useEffect(() => {
    const foundDocument = getDocumentById(documentId, mockUser.id);
    setDocument(foundDocument);
  }, [documentId]);

  function handleTableChange(table: TableData) {
    const updatedDocument = updateDocumentData(documentId, mockUser.id, table);

    if (updatedDocument !== null) {
      setDocument(updatedDocument);
    }
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
            Размер: {document.rows} × {document.cols}
          </p>
        </div>

        <button type="button" onClick={onBack}>
          Назад к документам
        </button>
      </div>

      <SpreadsheetTable initialTable={document.data} onTableChange={handleTableChange} />
    </div>
  );
}

export default SpreadsheetPage;