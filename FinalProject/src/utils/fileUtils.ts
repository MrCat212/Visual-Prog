import type { Cell, TableData } from '@/types/spreadsheet';
import { recalculateTable } from '@/utils/formulaUtils';
import { createDefaultCellStyle } from '@/utils/tableUtils';

export function tableToCsv(table: TableData): string {
  const lines: string[] = [];

  for (let i = 0; i < table.length; i++) {
    const values: string[] = [];

    for (let j = 0; j < table[i].length; j++) {
      values.push(prepareCsvValue(table[i][j].value));
    }

    lines.push(values.join(','));
  }

  return lines.join('\n');
}

export function tableToJson(table: TableData): string {
  return JSON.stringify(table, null, 2);
}

export function csvToTable(csvText: string): TableData {
  const lines = csvText.split('\n');
  const table: TableData = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      continue;
    }

    const values = line.split(',');
    const row: Cell[] = [];

    for (let j = 0; j < values.length; j++) {
      row.push({
        value: values[j].trim(),
        result: values[j].trim(),
        type: 'text',
        style: createDefaultCellStyle(),
      });
    }

    table.push(row);
  }

  return recalculateTable(table);
}

export function downloadTextFile(fileName: string, text: string, type: string) {
  const blob = new Blob([text], {
    type,
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

function prepareCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replaceAll('"', '""') + '"';
  }

  return value;
}
