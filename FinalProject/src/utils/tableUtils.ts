import type { Cell, TableData } from '@/types/spreadsheet';

export function createEmptyCell(): Cell {
  return {
    value: '',
    result: '',
    type: 'text',
  };
}

export function createTable(rows: number, cols: number): TableData {
  const table: TableData = [];

  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];

    for (let j = 0; j < cols; j++) {
      row.push(createEmptyCell());
    }

    table.push(row);
  }

  return table;
}

export function getColumnName(index: number): string {
  return String.fromCharCode(65 + index);
}