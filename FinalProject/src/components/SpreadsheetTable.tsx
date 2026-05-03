import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import FormulaBar from '@/components/FormulaBar';
import SpreadsheetCell from '@/components/SpreadsheetCell';
import type { Cell, SelectedCell, SelectedRange, TableData } from '@/types/spreadsheet';
import { recalculateTable } from '@/utils/formulaUtils';
import { createEmptyCell, createTable, getColumnName } from '@/utils/tableUtils';

const ROWS = 100;
const COLS = 26;

type ContextMenuState = {
  row: number;
  col: number;
  x: number;
  y: number;
};

function SpreadsheetTable() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [table, setTable] = useState<TableData>(() => createTable(ROWS, COLS));

  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    row: 0,
    col: 0,
  });

  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);

  const [editingCell, setEditingCell] = useState<SelectedCell | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const columnNames = useMemo(() => {
    const names: string[] = [];
    const colsCount = table[0]?.length ?? 0;

    for (let i = 0; i < colsCount; i++) {
      names.push(getColumnName(i));
    }

    return names;
  }, [table]);

  const activeCell = table[selectedCell.row][selectedCell.col];

  const handleSelect = useCallback(
    (row: number, col: number, withShift: boolean) => {
      if (withShift) {
        setSelectedRange({
          start: selectedCell,
          end: {
            row,
            col,
          },
        });
      } else {
        setSelectedRange(null);
      }

      setSelectedCell({
        row,
        col,
      });

      setContextMenu(null);
      wrapperRef.current?.focus();
    },
    [selectedCell],
  );

  const handleStartEdit = useCallback((row: number, col: number) => {
    setEditingCell({
      row,
      col,
    });
  }, []);

  const handleStopEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleOpenContextMenu = useCallback((row: number, col: number, x: number, y: number) => {
    setContextMenu({
      row,
      col,
      x,
      y,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setTable((oldTable) => {
      const newTable: TableData = [];

      for (let i = 0; i < oldTable.length; i++) {
        const newRow: Cell[] = [];

        for (let j = 0; j < oldTable[i].length; j++) {
          if (i === row && j === col) {
            newRow.push({
              value,
              result: value,
              type: 'text',
            });
          } else {
            newRow.push(oldTable[i][j]);
          }
        }

        newTable.push(newRow);
      }

      return recalculateTable(newTable);
    });
  }, []);

  const handleAddRow = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    setTable((oldTable) => {
      const newTable: TableData = [];
      const colsCount = oldTable[0]?.length ?? COLS;

      for (let i = 0; i < oldTable.length; i++) {
        newTable.push(oldTable[i]);

        if (i === contextMenu.row) {
          const newRow: Cell[] = [];

          for (let j = 0; j < colsCount; j++) {
            newRow.push(createEmptyCell());
          }

          newTable.push(newRow);
        }
      }

      return recalculateTable(newTable);
    });

    setContextMenu(null);
  }, [contextMenu]);

  const handleDeleteRow = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    setTable((oldTable) => {
      if (oldTable.length <= 1) {
        return oldTable;
      }

      const newTable: TableData = [];

      for (let i = 0; i < oldTable.length; i++) {
        if (i !== contextMenu.row) {
          newTable.push(oldTable[i]);
        }
      }

      return recalculateTable(newTable);
    });

    setSelectedCell({
      row: Math.max(0, contextMenu.row - 1),
      col: contextMenu.col,
    });

    setContextMenu(null);
  }, [contextMenu]);

  const handleAddColumn = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    setTable((oldTable) => {
      const newTable: TableData = [];

      for (let i = 0; i < oldTable.length; i++) {
        const newRow: Cell[] = [];

        for (let j = 0; j < oldTable[i].length; j++) {
          newRow.push(oldTable[i][j]);

          if (j === contextMenu.col) {
            newRow.push(createEmptyCell());
          }
        }

        newTable.push(newRow);
      }

      return recalculateTable(newTable);
    });

    setContextMenu(null);
  }, [contextMenu]);

  const handleDeleteColumn = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    setTable((oldTable) => {
      const colsCount = oldTable[0]?.length ?? 0;

      if (colsCount <= 1) {
        return oldTable;
      }

      const newTable: TableData = [];

      for (let i = 0; i < oldTable.length; i++) {
        const newRow: Cell[] = [];

        for (let j = 0; j < oldTable[i].length; j++) {
          if (j !== contextMenu.col) {
            newRow.push(oldTable[i][j]);
          }
        }

        newTable.push(newRow);
      }

      return recalculateTable(newTable);
    });

    setSelectedCell({
      row: contextMenu.row,
      col: Math.max(0, contextMenu.col - 1),
    });

    setContextMenu(null);
  }, [contextMenu]);

  const handleTableKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && editingCell === null) {
        event.preventDefault();

        setEditingCell({
          row: selectedCell.row,
          col: selectedCell.col,
        });
      }

      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    },
    [editingCell, selectedCell],
  );

  function handleWrapperClick(event: MouseEvent<HTMLDivElement>) {
    if (event.button === 0) {
      setContextMenu(null);
    }
  }

  function isCellInSelectedRange(row: number, col: number): boolean {
    if (selectedRange === null) {
      return false;
    }

    const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
    const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
    const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
    const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);

    return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
  }

  return (
    <div
      className="spreadsheet-wrapper"
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleTableKeyDown}
      onClick={handleWrapperClick}
    >
      <FormulaBar value={activeCell.value} />

      <div className="table-scroll">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="corner-cell"></th>

              {columnNames.map((name) => (
                <th key={name} className="column-header">
                  {name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="row-header">{rowIndex + 1}</th>

                {row.map((cell, colIndex) => (
                  <SpreadsheetCell
                    key={colIndex}
                    cell={cell}
                    row={rowIndex}
                    col={colIndex}
                    isSelected={selectedCell.row === rowIndex && selectedCell.col === colIndex}
                    isInSelectedRange={isCellInSelectedRange(rowIndex, colIndex)}
                    isEditing={
                      editingCell !== null &&
                      editingCell.row === rowIndex &&
                      editingCell.col === colIndex
                    }
                    onSelect={handleSelect}
                    onChange={handleCellChange}
                    onStartEdit={handleStartEdit}
                    onStopEdit={handleStopEdit}
                    onOpenContextMenu={handleOpenContextMenu}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contextMenu !== null && (
        <div
          className="context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button type="button" onClick={handleAddRow}>
            Добавить строку ниже
          </button>

          <button type="button" onClick={handleDeleteRow}>
            Удалить строку
          </button>

          <button type="button" onClick={handleAddColumn}>
            Добавить столбец справа
          </button>

          <button type="button" onClick={handleDeleteColumn}>
            Удалить столбец
          </button>

          <button type="button" onClick={handleCloseContextMenu}>
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}

export default SpreadsheetTable;