import type { TableData } from '@/types/spreadsheet';

export type SpreadsheetDocument = {
  id: string;
  userId: string;
  title: string;
  rows: number;
  cols: number;
  createdAt: string;
  updatedAt: string;
  data: TableData;
};

export type CreateDocumentData = {
  title: string;
  rows: number;
  cols: number;
};
