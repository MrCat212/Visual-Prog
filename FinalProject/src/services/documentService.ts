import type { CreateDocumentData, SpreadsheetDocument } from '@/types/document';
import { createTable } from '@/utils/tableUtils';

const STORAGE_KEY = 'spreadsheet_documents';

function getAllDocuments(): SpreadsheetDocument[] {
  const json = localStorage.getItem(STORAGE_KEY);

  if (json === null) {
    return [];
  }

  try {
    const documents = JSON.parse(json) as SpreadsheetDocument[];
    return documents;
  } catch {
    return [];
  }
}

function saveAllDocuments(documents: SpreadsheetDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

function createId(): string {
  return 'doc-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

export function getUserDocuments(userId: string): SpreadsheetDocument[] {
  const documents = getAllDocuments();
  const userDocuments: SpreadsheetDocument[] = [];

  for (let i = 0; i < documents.length; i++) {
    if (documents[i].userId === userId) {
      userDocuments.push(documents[i]);
    }
  }

  return userDocuments;
}

export function getDocumentById(
  documentId: string,
  userId: string,
): SpreadsheetDocument | null {
  const documents = getAllDocuments();

  for (let i = 0; i < documents.length; i++) {
    if (documents[i].id === documentId && documents[i].userId === userId) {
      return documents[i];
    }
  }

  return null;
}

export function createDocument(
  userId: string,
  data: CreateDocumentData,
): SpreadsheetDocument {
  const now = new Date().toISOString();

  const document: SpreadsheetDocument = {
    id: createId(),
    userId,
    title: data.title,
    rows: data.rows,
    cols: data.cols,
    createdAt: now,
    updatedAt: now,
    data: createTable(data.rows, data.cols),
  };

  const documents = getAllDocuments();
  documents.push(document);
  saveAllDocuments(documents);

  return document;
}

export function updateDocument(document: SpreadsheetDocument): SpreadsheetDocument {
  const documents = getAllDocuments();
  const newDocuments: SpreadsheetDocument[] = [];

  const updatedDocument: SpreadsheetDocument = {
    ...document,
    updatedAt: new Date().toISOString(),
  };

  for (let i = 0; i < documents.length; i++) {
    if (documents[i].id === document.id) {
      newDocuments.push(updatedDocument);
    } else {
      newDocuments.push(documents[i]);
    }
  }

  saveAllDocuments(newDocuments);

  return updatedDocument;
}

export function renameDocument(
  documentId: string,
  userId: string,
  newTitle: string,
): SpreadsheetDocument | null {
  const document = getDocumentById(documentId, userId);

  if (document === null) {
    return null;
  }

  return updateDocument({
    ...document,
    title: newTitle,
  });
}

export function deleteDocument(documentId: string, userId: string) {
  const documents = getAllDocuments();
  const newDocuments: SpreadsheetDocument[] = [];

  for (let i = 0; i < documents.length; i++) {
    const isDeletedDocument = documents[i].id === documentId && documents[i].userId === userId;

    if (!isDeletedDocument) {
      newDocuments.push(documents[i]);
    }
  }

  saveAllDocuments(newDocuments);
}

export function duplicateDocument(
  documentId: string,
  userId: string,
): SpreadsheetDocument | null {
  const document = getDocumentById(documentId, userId);

  if (document === null) {
    return null;
  }

  const now = new Date().toISOString();

  const copy: SpreadsheetDocument = {
    ...document,
    id: createId(),
    title: document.title + ' копия',
    createdAt: now,
    updatedAt: now,
  };

  const documents = getAllDocuments();
  documents.push(copy);
  saveAllDocuments(documents);

  return copy;
}