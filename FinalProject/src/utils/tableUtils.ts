import type { Cell, CellStyle, TableData } from '@/types/spreadsheet';

export function createDefaultCellStyle(): CellStyle {
  return {
    isBold: false,
    isItalic: false,
    isUnderline: false,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    textAlign: 'left',
    numberFormat: 'normal',
  };
}

export function createEmptyCell(): Cell {
  return {
    value: '',
    result: '',
    type: 'text',
    style: createDefaultCellStyle(),
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
  let name = '';
  let number = index;

  while (number >= 0) {
    const letterCode = (number % 26) + 65;
    name = String.fromCharCode(letterCode) + name;
    number = Math.floor(number / 26) - 1;
  }

  return name;
}
