import { describe, expect, it } from 'vitest';

import spreadsheetReducer, {
  addColumn,
  addRow,
  changeCell,
  deleteColumn,
  deleteRow,
  pasteCells,
  redo,
  replaceTable,
  selectCell,
  selectRange,
  undo,
} from '@/features/spreadsheet/spreadsheetSlice';
import type { TableData } from '@/types/spreadsheet';
import { createDefaultCellStyle, createTable } from '@/utils/tableUtils';

function createSmallTable(): TableData {
  return createTable(3, 3);
}

describe('spreadsheetSlice', () => {
  it('должен иметь начальное состояние', () => {
    const state = spreadsheetReducer(undefined, {
      type: 'unknown',
    });

    expect(state.table.length).toBe(100);
    expect(state.table[0].length).toBe(26);
    expect(state.selectedCell).toEqual({
      row: 0,
      col: 0,
    });
    expect(state.selectedRange).toBe(null);
  });

  it('должен заменять таблицу', () => {
    const table = createSmallTable();
    const state = spreadsheetReducer(undefined, replaceTable(table));

    expect(state.table.length).toBe(3);
    expect(state.table[0].length).toBe(3);
  });

  it('должен выбирать ячейку', () => {
    const state = spreadsheetReducer(
      undefined,
      selectCell({
        row: 2,
        col: 1,
      }),
    );

    expect(state.selectedCell).toEqual({
      row: 2,
      col: 1,
    });
    expect(state.selectedRange).toBe(null);
  });

  it('должен выбирать диапазон', () => {
    const state = spreadsheetReducer(
      undefined,
      selectRange({
        start: {
          row: 0,
          col: 0,
        },
        end: {
          row: 2,
          col: 2,
        },
      }),
    );

    expect(state.selectedRange).toEqual({
      start: {
        row: 0,
        col: 0,
      },
      end: {
        row: 2,
        col: 2,
      },
    });
  });

  it('должен менять значение ячейки', () => {
    const table = createSmallTable();
    const stateWithTable = spreadsheetReducer(undefined, replaceTable(table));

    const changedState = spreadsheetReducer(
      stateWithTable,
      changeCell({
        row: 0,
        col: 0,
        value: '10',
      }),
    );

    expect(changedState.table[0][0].value).toBe('10');
    expect(changedState.table[0][0].result).toBe('10');
  });

  it('должен считать простую формулу', () => {
    let state = spreadsheetReducer(undefined, replaceTable(createSmallTable()));

    state = spreadsheetReducer(
      state,
      changeCell({
        row: 0,
        col: 0,
        value: '10',
      }),
    );

    state = spreadsheetReducer(
      state,
      changeCell({
        row: 0,
        col: 1,
        value: '20',
      }),
    );

    state = spreadsheetReducer(
      state,
      changeCell({
        row: 0,
        col: 2,
        value: '=A1+B1',
      }),
    );

    expect(state.table[0][2].result).toBe('30');
  });

  it('должен добавлять строку', () => {
    const table = createSmallTable();
    const stateWithTable = spreadsheetReducer(undefined, replaceTable(table));

    const state = spreadsheetReducer(
      stateWithTable,
      addRow({
        row: 1,
      }),
    );

    expect(state.table.length).toBe(4);
  });

  it('должен удалять строку', () => {
    const table = createSmallTable();
    const stateWithTable = spreadsheetReducer(undefined, replaceTable(table));

    const state = spreadsheetReducer(
      stateWithTable,
      deleteRow({
        row: 1,
      }),
    );

    expect(state.table.length).toBe(2);
  });

  it('должен добавлять столбец', () => {
    const table = createSmallTable();
    const stateWithTable = spreadsheetReducer(undefined, replaceTable(table));

    const state = spreadsheetReducer(
      stateWithTable,
      addColumn({
        col: 1,
      }),
    );

    expect(state.table[0].length).toBe(4);
  });

  it('должен удалять столбец', () => {
    const table = createSmallTable();
    const stateWithTable = spreadsheetReducer(undefined, replaceTable(table));

    const state = spreadsheetReducer(
      stateWithTable,
      deleteColumn({
        col: 1,
      }),
    );

    expect(state.table[0].length).toBe(2);
  });

  it('должен делать undo и redo', () => {
    let state = spreadsheetReducer(undefined, replaceTable(createSmallTable()));

    state = spreadsheetReducer(
      state,
      changeCell({
        row: 0,
        col: 0,
        value: 'Привет',
      }),
    );

    expect(state.table[0][0].value).toBe('Привет');

    state = spreadsheetReducer(state, undo());

    expect(state.table[0][0].value).toBe('');

    state = spreadsheetReducer(state, redo());

    expect(state.table[0][0].value).toBe('Привет');
  });

  it('должен вставлять значения из буфера обмена', () => {
    let state = spreadsheetReducer(undefined, replaceTable(createSmallTable()));

    state = spreadsheetReducer(
      state,
      pasteCells({
        startRow: 0,
        startCol: 0,
        cells: [
          [
            {
              value: 'A',
              style: null,
            },
            {
              value: 'B',
              style: null,
            },
          ],
          [
            {
              value: 'C',
              style: null,
            },
            {
              value: 'D',
              style: null,
            },
          ],
        ],
      }),
    );

    expect(state.table[0][0].value).toBe('A');
    expect(state.table[0][1].value).toBe('B');
    expect(state.table[1][0].value).toBe('C');
    expect(state.table[1][1].value).toBe('D');
  });

  it('должен вставлять значения вместе со стилями', () => {
    let state = spreadsheetReducer(undefined, replaceTable(createSmallTable()));

    const style = {
      ...createDefaultCellStyle(),
      isBold: true,
      isItalic: true,
      backgroundColor: '#ff0000',
      textColor: '#ffffff',
      textAlign: 'center' as const,
    };

    state = spreadsheetReducer(
      state,
      pasteCells({
        startRow: 0,
        startCol: 0,
        cells: [
          [
            {
              value: 'Styled',
              style,
            },
          ],
        ],
      }),
    );

    expect(state.table[0][0].value).toBe('Styled');
    expect(state.table[0][0].style.isBold).toBe(true);
    expect(state.table[0][0].style.isItalic).toBe(true);
    expect(state.table[0][0].style.backgroundColor).toBe('#ff0000');
    expect(state.table[0][0].style.textColor).toBe('#ffffff');
    expect(state.table[0][0].style.textAlign).toBe('center');
  });
});