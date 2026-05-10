import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setActiveDocumentId } from '@/features/documents/documentsSlice';
import DashboardPage from '@/pages/DashboardPage';
import SpreadsheetPage from '@/pages/SpreadsheetPage';

function App() {
  const dispatch = useAppDispatch();
  const activeDocumentId = useAppSelector((state) => state.documents.activeDocumentId);

  if (activeDocumentId !== null) {
    return (
      <SpreadsheetPage
        documentId={activeDocumentId}
        onBack={() => dispatch(setActiveDocumentId(null))}
      />
    );
  }

  return <DashboardPage />;
}

export default App;