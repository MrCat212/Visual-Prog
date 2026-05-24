import type { Cell, CellType, TableData } from '@/types/spreadsheet';
import { createDefaultCellStyle } from '@/utils/tableUtils';

type CellPosition = {
  row: number;
  col: number;
};

export function getCellType(value: string): CellType {
  const text = value.trim();

  if (text.startsWith('=')) {
    return 'formula';
  }

  if (text === 'true' || text === 'false') {
    return 'boolean';
  }

  if (text !== '' && !Number.isNaN(Number(text))) {
    return 'number';
  }

  return 'text';
}

export function recalculateTable(table: TableData): TableData {
  const newTable: TableData = [];

  for (let i = 0; i < table.length; i++) {
    const newRow: Cell[] = [];

    for (let j = 0; j < table[i].length; j++) {
      const oldCell = table[i][j];
      const type = getCellType(oldCell.value);

      newRow.push({
        value: oldCell.value,
        result: oldCell.value,
        type,
        style: oldCell.style ?? createDefaultCellStyle(),
      });
    }

    newTable.push(newRow);
  }

  for (let i = 0; i < newTable.length; i++) {
    for (let j = 0; j < newTable[i].length; j++) {
      const cell = newTable[i][j];

      if (cell.type === 'formula') {
        cell.result = calculateFormula(cell.value, newTable);
      }
    }
  }

  return newTable;
}

function calculateFormula(value: string, table: TableData): string {
  const formula = value.trim().slice(1).toUpperCase().replaceAll(' ', '');

  if (formula.startsWith('SUM(') && formula.endsWith(')')) {
    const range = formula.slice(4, -1);
    const numbers = getRangeNumbers(range, table);

    let sum = 0;

    for (let i = 0; i < numbers.length; i++) {
      sum += numbers[i];
    }

    return formatNumber(sum);
  }

  if (formula.startsWith('AVERAGE(') && formula.endsWith(')')) {
    const range = formula.slice(8, -1);
    const numbers = getRangeNumbers(range, table);

    if (numbers.length === 0) {
      return '0';
    }

    let sum = 0;

    for (let i = 0; i < numbers.length; i++) {
      sum += numbers[i];
    }

    return formatNumber(sum / numbers.length);
  }

  return calculateSimpleOperation(formula, table);
}

function calculateSimpleOperation(formula: string, table: TableData): string {
  const cellPattern = '[A-Z][1-9][0-9]*';
  const numberPattern = '-?\\d+(?:\\.\\d+)?';
  const operationPattern = new RegExp(
    `^(${cellPattern}|${numberPattern})([+\\-*/])(${cellPattern}|${numberPattern})$`,
  );

  const match = formula.match(operationPattern);

  if (match === null) {
    return 'ERROR';
  }

  const left = getOperandNumber(match[1], table);
  const operator = match[2];
  const right = getOperandNumber(match[3], table);

  if (operator === '+') {
    return formatNumber(left + right);
  }

  if (operator === '-') {
    return formatNumber(left - right);
  }

  if (operator === '*') {
    return formatNumber(left * right);
  }

  if (operator === '/') {
    if (right === 0) {
      return 'ERROR';
    }

    return formatNumber(left / right);
  }

  return 'ERROR';
}

function getOperandNumber(operand: string, table: TableData): number {
  if (operand[0] >= 'A' && operand[0] <= 'Z') {
    return getCellNumber(operand, table);
  }

  const number = Number(operand);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
}

function getCellNumber(address: string, table: TableData): number {
  const position = getCellPosition(address);

  if (position === null) {
    return 0;
  }

  if (table[position.row] === undefined) {
    return 0;
  }

  if (table[position.row][position.col] === undefined) {
    return 0;
  }

  const cell = table[position.row][position.col];
  const number = Number(cell.result);

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
}

function getRangeNumbers(range: string, table: TableData): number[] {
  const parts = range.split(':');

  if (parts.length !== 2) {
    return [];
  }

  const start = getCellPosition(parts[0]);
  const end = getCellPosition(parts[1]);

  if (start === null || end === null) {
    return [];
  }

  const numbers: number[] = [];

  const startRow = Math.min(start.row, end.row);
  const endRow = Math.max(start.row, end.row);
  const startCol = Math.min(start.col, end.col);
  const endCol = Math.max(start.col, end.col);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (table[row] !== undefined && table[row][col] !== undefined) {
        const number = Number(table[row][col].result);

        if (!Number.isNaN(number)) {
          numbers.push(number);
        }
      }
    }
  }

  return numbers;
}

function getCellPosition(address: string): CellPosition | null {
  const text = address.trim().toUpperCase();
  const match = text.match(/^([A-Z])([1-9][0-9]*)$/);

  if (match === null) {
    return null;
  }

  const col = match[1].charCodeAt(0) - 65;
  const row = Number(match[2]) - 1;

  return {
    row,
    col,
  };
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'ERROR';
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return String(Number(value.toFixed(5)));
}
