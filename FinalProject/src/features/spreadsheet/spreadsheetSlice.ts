import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Cell, SelectedCell, SelectedRange, TableData } from '@/types/spreadsheet';
import { recalculateTable } from '@/utils/formulaUtils';
import { createTable } from '@/utils/tableUtils';

type ChangeCellPayload = {
  row: number;
  col: number;
  value: string;
};

type SpreadsheetState = {
  table: TableData;
  selectedCell: SelectedCell;
  selectedRange: SelectedRange | null;
  past: TableData[];
  future: TableData[];
};

const initialState: SpreadsheetState = {
  table: createTable(100, 26),
  selectedCell: {
    row: 0,
    col: 0,
  },
  selectedRange: null,
  past: [],
  future: [],
};

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setTable(state, action: PayloadAction<TableData>) {
      state.table = action.payload;
      state.past = [];
      state.future = [];
    },

    selectCell(state, action: PayloadAction<SelectedCell>) {
      state.selectedCell = action.payload;
      state.selectedRange = null;
    },

    selectRange(state, action: PayloadAction<SelectedRange>) {
      state.selectedRange = action.payload;
    },

    changeCell(state, action: PayloadAction<ChangeCellPayload>) {
      const newTable: TableData = [];

      for (let i = 0; i < state.table.length; i++) {
        const newRow: Cell[] = [];

        for (let j = 0; j < state.table[i].length; j++) {
          if (i === action.payload.row && j === action.payload.col) {
            newRow.push({
              value: action.payload.value,
              result: action.payload.value,
              type: 'text',
            });
          } else {
            newRow.push(state.table[i][j]);
          }
        }

        newTable.push(newRow);
      }

      state.past.push(state.table);
      state.table = recalculateTable(newTable);
      state.future = [];
    },

    undo(state) {
      const previousTable = state.past.pop();

      if (previousTable === undefined) {
        return;
      }

      state.future.push(state.table);
      state.table = previousTable;
    },

    redo(state) {
      const nextTable = state.future.pop();

      if (nextTable === undefined) {
        return;
      }

      state.past.push(state.table);
      state.table = nextTable;
    },
  },
});

export const { setTable, selectCell, selectRange, changeCell, undo, redo } =
  spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;