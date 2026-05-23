import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type {
  Cell,
  CellStyle,
  NumberFormat,
  SelectedCell,
  SelectedRange,
  TableData,
  TextAlign,
} from '@/types/spreadsheet';
import { recalculateTable } from '@/utils/formulaUtils';
import { createDefaultCellStyle, createEmptyCell, createTable } from '@/utils/tableUtils';

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

type PasteCellsPayload = {
  startRow: number;
  startCol: number;
  values: string[][];
};

type SetTextColorPayload = {
  color: string;
};

type SetBackgroundColorPayload = {
  color: string;
};

type SetTextAlignPayload = {
  textAlign: TextAlign;
};

type SetNumberFormatPayload = {
  numberFormat: NumberFormat;
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

function getCellStyle(cell: Cell): CellStyle {
  return cell.style ?? createDefaultCellStyle();
}

function getSelectedBounds(state: SpreadsheetState) {
  if (state.selectedRange === null) {
    return {
      startRow: state.selectedCell.row,
      endRow: state.selectedCell.row,
      startCol: state.selectedCell.col,
      endCol: state.selectedCell.col,
    };
  }

  return {
    startRow: Math.min(state.selectedRange.start.row, state.selectedRange.end.row),
    endRow: Math.max(state.selectedRange.start.row, state.selectedRange.end.row),
    startCol: Math.min(state.selectedRange.start.col, state.selectedRange.end.col),
    endCol: Math.max(state.selectedRange.start.col, state.selectedRange.end.col),
  };
}

function updateSelectedCellsStyle(
  state: SpreadsheetState,
  getNewStyle: (oldStyle: CellStyle) => CellStyle,
) {
  saveToHistory(state);

  const bounds = getSelectedBounds(state);
  const newTable: TableData = [];

  for (let row = 0; row < state.table.length; row++) {
    const newRow: Cell[] = [];

    for (let col = 0; col < state.table[row].length; col++) {
      const cell = state.table[row][col];

      const isSelected =
        row >= bounds.startRow &&
        row <= bounds.endRow &&
        col >= bounds.startCol &&
        col <= bounds.endCol;

      if (isSelected) {
        newRow.push({
          ...cell,
          style: getNewStyle(getCellStyle(cell)),
        });
      } else {
        newRow.push(cell);
      }
    }

    newTable.push(newRow);
  }

  state.table = newTable;
}

const spreadsheetSlice = createSlice({
  name: 'spreadsheet',
  initialState,
  reducers: {
    setTable(state, action: PayloadAction<TableData>) {
      state.table = recalculateTable(action.payload);
      state.selectedCell = {
        row: 0,
        col: 0,
      };
      state.selectedRange = null;
      state.past = [];
      state.future = [];
    },

    replaceTable(state, action: PayloadAction<TableData>) {
      saveToHistory(state);

      state.table = recalculateTable(action.payload);
      state.selectedCell = {
        row: 0,
        col: 0,
      };
      state.selectedRange = null;
    },

    selectCell(state, action: PayloadAction<SelectedCell>) {
      state.selectedCell = action.payload;
      state.selectedRange = null;
    },

    selectRange(state, action: PayloadAction<SelectedRange>) {
      state.selectedRange = action.payload;
    },

    selectAllCells(state) {
      const lastRow = Math.max(0, state.table.length - 1);
      const lastCol = Math.max(0, (state.table[0]?.length ?? 1) - 1);

      state.selectedCell = {
        row: 0,
        col: 0,
      };

      state.selectedRange = {
        start: {
          row: 0,
          col: 0,
        },
        end: {
          row: lastRow,
          col: lastCol,
        },
      };
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
              style: getCellStyle(state.table[i][j]),
            });
          } else {
            newRow.push(state.table[i][j]);
          }
        }

        newTable.push(newRow);
      }

      state.table = recalculateTable(newTable);
    },

    clearSelectedCells(state) {
      saveToHistory(state);

      const bounds = getSelectedBounds(state);
      const newTable: TableData = [];

      for (let row = 0; row < state.table.length; row++) {
        const newRow: Cell[] = [];

        for (let col = 0; col < state.table[row].length; col++) {
          const cell = state.table[row][col];

          const isSelected =
            row >= bounds.startRow &&
            row <= bounds.endRow &&
            col >= bounds.startCol &&
            col <= bounds.endCol;

          if (isSelected) {
            newRow.push({
              value: '',
              result: '',
              type: 'text',
              style: getCellStyle(cell),
            });
          } else {
            newRow.push(cell);
          }
        }

        newTable.push(newRow);
      }

      state.table = recalculateTable(newTable);
    },

    pasteCells(state, action: PayloadAction<PasteCellsPayload>) {
      saveToHistory(state);

      const newTable: TableData = [];

      for (let row = 0; row < state.table.length; row++) {
        const newRow: Cell[] = [];

        for (let col = 0; col < state.table[row].length; col++) {
          const pasteRow = row - action.payload.startRow;
          const pasteCol = col - action.payload.startCol;
          const pastedValue = action.payload.values[pasteRow]?.[pasteCol];

          if (pastedValue !== undefined) {
            newRow.push({
              value: pastedValue,
              result: pastedValue,
              type: 'text',
              style: getCellStyle(state.table[row][col]),
            });
          } else {
            newRow.push(state.table[row][col]);
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

    toggleBold(state) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        isBold: !oldStyle.isBold,
      }));
    },

    toggleItalic(state) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        isItalic: !oldStyle.isItalic,
      }));
    },

    toggleUnderline(state) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        isUnderline: !oldStyle.isUnderline,
      }));
    },

    setTextColor(state, action: PayloadAction<SetTextColorPayload>) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        textColor: action.payload.color,
      }));
    },

    setBackgroundColor(state, action: PayloadAction<SetBackgroundColorPayload>) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        backgroundColor: action.payload.color,
      }));
    },

    setTextAlign(state, action: PayloadAction<SetTextAlignPayload>) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        textAlign: action.payload.textAlign,
      }));
    },

    setNumberFormat(state, action: PayloadAction<SetNumberFormatPayload>) {
      updateSelectedCellsStyle(state, (oldStyle) => ({
        ...oldStyle,
        numberFormat: action.payload.numberFormat,
      }));
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
  replaceTable,
  selectCell,
  selectRange,
  selectAllCells,
  changeCell,
  clearSelectedCells,
  pasteCells,
  addRow,
  deleteRow,
  addColumn,
  deleteColumn,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setTextColor,
  setBackgroundColor,
  setTextAlign,
  setNumberFormat,
  undo,
  redo,
} = spreadsheetSlice.actions;

export default spreadsheetSlice.reducer;