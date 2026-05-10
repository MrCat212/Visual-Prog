import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { Cell, SelectedCell, SelectedRange, TableData } from '@/types/spreadsheet';
import { recalculateTable } from '@/utils/formulaUtils';
import { createEmptyCell, createTable } from '@/utils/tableUtils';

type ChangeCellPayload = {
  row: number;
  col: number;
  value: string;
};

type AddRowPayload = {
  row: number;
};

type DeleteRowPayload = {
  row: number;
};

type AddColumnPayload = {
  col: number;
};

type DeleteColumnPayload = {
  col: number;
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

function saveToHistory(state: SpreadsheetState) {
  state.past.push(state.table);
  state.future = [];
}

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setTable(state, action: PayloadAction<TableData>) {
      state.table = action.payload;
      state.selectedCell = {
        row: 0,
        col: 0,
      };
      state.selectedRange = null;
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
      saveToHistory(state);

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

      state.table = recalculateTable(newTable);
    },

    addRow(state, action: PayloadAction<AddRowPayload>) {
      saveToHistory(state);

      const newTable: TableData = [];
      const colsCount = state.table[0]?.length ?? 26;

      for (let i = 0; i < state.table.length; i++) {
        newTable.push(state.table[i]);

        if (i === action.payload.row) {
          const newRow: Cell[] = [];

          for (let j = 0; j < colsCount; j++) {
            newRow.push(createEmptyCell());
          }

          newTable.push(newRow);
        }
      }

      state.table = recalculateTable(newTable);
    },

    deleteRow(state, action: PayloadAction<DeleteRowPayload>) {
      if (state.table.length <= 1) {
        return;
      }

      saveToHistory(state);

      const newTable: TableData = [];

      for (let i = 0; i < state.table.length; i++) {
        if (i !== action.payload.row) {
          newTable.push(state.table[i]);
        }
      }

      state.table = recalculateTable(newTable);

      state.selectedCell = {
        row: Math.max(0, action.payload.row - 1),
        col: state.selectedCell.col,
      };
    },

    addColumn(state, action: PayloadAction<AddColumnPayload>) {
      saveToHistory(state);

      const newTable: TableData = [];

      for (let i = 0; i < state.table.length; i++) {
        const newRow: Cell[] = [];

        for (let j = 0; j < state.table[i].length; j++) {
          newRow.push(state.table[i][j]);

          if (j === action.payload.col) {
            newRow.push(createEmptyCell());
          }
        }

        newTable.push(newRow);
      }

      state.table = recalculateTable(newTable);
    },

    deleteColumn(state, action: PayloadAction<DeleteColumnPayload>) {
      const colsCount = state.table[0]?.length ?? 0;



      if (colsCount <= 1) {
        return;
      }

      saveToHistory(state);

      const newTable: TableData = [];

      for (let i = 0; i < state.table.length; i++) {
        const newRow: Cell[] = [];

        for (let j = 0; j < state.table[i].length; j++) {
          if (j !== action.payload.col) {
            newRow.push(state.table[i][j]);
          }
        }

        newTable.push(newRow);
      }

      state.table = recalculateTable(newTable);

      state.selectedCell = {
        row: state.selectedCell.row,
        col: Math.max(0, action.payload.col - 1),
      };
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

export const {
  setTable,
  selectCell,
  selectRange,
  changeCell,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
  undo,
  redo,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;