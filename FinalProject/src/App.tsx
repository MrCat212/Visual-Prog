import { useState } from 'react';

import DashboardPage from '@/pages/DashboardPage';
import SpreadsheetPage from '@/pages/SpreadsheetPage';

function App() {
  const [openedDocumentId, setOpenedDocumentId] = useState<string | null>(null);

  if (openedDocumentId !== null) {
    return (
      <SpreadsheetPage
        documentId={openedDocumentId}
        onBack={() => setOpenedDocumentId(null)}
      />
    );
  }

  return <DashboardPage onOpenDocument={setOpenedDocumentId} />;
}

export default App;