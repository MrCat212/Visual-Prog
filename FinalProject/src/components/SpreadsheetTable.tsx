import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, UIEvent } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import FormattingToolbar from '@/components/FormattingToolbar';
import FormulaBar from '@/components/FormulaBar';
import SpreadsheetCell from '@/components/SpreadsheetCell';
import {
  addColumn,
  addRow,
  changeCell,
  clearSelectedCells,
  deleteColumn,
  deleteRow,
  redo,
  selectAllCells,
  selectCell,
  selectRange,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  undo,
} from '@/features/spreadsheet/spreadsheetSlice';
import type { SelectedCell } from '@/types/spreadsheet';
import { getColumnName } from '@/utils/tableUtils';

const ROWS = 1000;
const COLS = 26;
const DEFAULT_COLUMN_WIDTH = 100;
const MIN_COLUMN_WIDTH = 50;
const DEFAULT_ROW_HEIGHT = 28;
const MIN_ROW_HEIGHT = 22;
const TABLE_HEIGHT = 600;
const EXTRA_ROWS = 20;

type ContextMenuState = {
  row: number;
  col: number;
  x: number;
  y: number;
};

type ResizingColumn = {
  col: number;
  startX: number;
  startWidth: number;
};

type ResizingRow = {
  row: number;
  startY: number;
  startHeight: number;
};

type VisibleRows = {
  start: number;
  end: number;
};

function SpreadsheetTable() {
  const dispatch = useAppDispatch();

  const table = useAppSelector((state) => state.spreadsheet.table);
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);
  const selectedRange = useAppSelector((state) => state.spreadsheet.selectedRange);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [scrollTop, setScrollTop] = useState(0);

  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    const widths: number[] = [];

    for (let i = 0; i < COLS; i++) {
      widths.push(DEFAULT_COLUMN_WIDTH);
    }

    return widths;
  });

  const [rowHeights, setRowHeights] = useState<number[]>(() => {
    const heights: number[] = [];

    for (let i = 0; i < ROWS; i++) {
      heights.push(DEFAULT_ROW_HEIGHT);
    }

    return heights;
  });

  const [editingCell, setEditingCell] = useState<SelectedCell | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [resizingColumn, setResizingColumn] = useState<ResizingColumn | null>(null);
  const [resizingRow, setResizingRow] = useState<ResizingRow | null>(null);

  useEffect(() => {
    function isCtrlOrMetaPressed(event: globalThis.KeyboardEvent): boolean {
      return event.ctrlKey || event.metaKey;
    }

    function isZKey(event: globalThis.KeyboardEvent): boolean {
      return event.key.toLowerCase() === 'z' || event.code === 'KeyZ';
    }

    function isYKey(event: globalThis.KeyboardEvent): boolean {
      return event.key.toLowerCase() === 'y' || event.code === 'KeyY';
    }

    function isBKey(event: globalThis.KeyboardEvent): boolean {
      return event.key.toLowerCase() === 'b' || event.code === 'KeyB';
    }

    function isIKey(event: globalThis.KeyboardEvent): boolean {
      return event.key.toLowerCase() === 'i' || event.code === 'KeyI';
    }

    function isUKey(event: globalThis.KeyboardEvent): boolean {
      return event.key.toLowerCase() === 'u' || event.code === 'KeyU';
    }

    function isAKey(event: globalThis.KeyboardEvent): boolean {
      return event.key.toLowerCase() === 'a' || event.code === 'KeyA';
    }

    function handleWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (editingCell !== null) {
        return;
      }

      if (isCtrlOrMetaPressed(event) && isAKey(event)) {
        event.preventDefault();
        dispatch(selectAllCells());
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        dispatch(clearSelectedCells());
        return;
      }

      if (isCtrlOrMetaPressed(event) && event.shiftKey && isZKey(event)) {
        event.preventDefault();
        dispatch(redo());
        return;
      }


      if (isCtrlOrMetaPressed(event) && isZKey(event)) {
        event.preventDefault();
        dispatch(undo());
        return;
      }

      if (isCtrlOrMetaPressed(event) && isYKey(event)) {
        event.preventDefault();
        dispatch(redo());
        return;
      }

      if (isCtrlOrMetaPressed(event) && isBKey(event)) {
        event.preventDefault();
        dispatch(toggleBold());
        return;
      }

      if (isCtrlOrMetaPressed(event) && isIKey(event)) {
        event.preventDefault();
        dispatch(toggleItalic());
        return;
      }

      if (isCtrlOrMetaPressed(event) && isUKey(event)) {
        event.preventDefault();
        dispatch(toggleUnderline());
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleWindowKeyDown, true);
    };
  }, [dispatch, editingCell]);

  const columnCount = table[0]?.length ?? 0;

  const columnNames = useMemo(() => {
    const names: string[] = [];

    for (let i = 0; i < columnCount; i++) {
      names.push(getColumnName(i));
    }

    return names;
  }, [columnCount]);

  const rowOffsets = useMemo(() => {
    const offsets: number[] = [0];

    for (let i = 0; i < table.length; i++) {
      offsets.push(offsets[i] + (rowHeights[i] ?? DEFAULT_ROW_HEIGHT));
    }

    return offsets;
  }, [rowHeights, table.length]);

  const totalRowsHeight = rowOffsets[rowOffsets.length - 1];

  const visibleRows = useMemo<VisibleRows>(() => {
    let start = 0;

    while (start < table.length - 1 && rowOffsets[start + 1] < scrollTop) {
      start++;
    }

    start = Math.max(0, start - EXTRA_ROWS);

    let end = start;

    while (end < table.length && rowOffsets[end] < scrollTop + TABLE_HEIGHT) {
      end++;
    }

    end = Math.min(table.length, end + EXTRA_ROWS);

    return {
      start,
      end,
    };
  }, [rowOffsets, scrollTop, table.length]);

  const topPadding = rowOffsets[visibleRows.start];
  const bottomPadding = totalRowsHeight - rowOffsets[visibleRows.end];

  const activeCell = table[selectedCell.row]?.[selectedCell.col];

  const visibleTableRows = useMemo(() => {
    return table.slice(visibleRows.start, visibleRows.end);
  }, [table, visibleRows]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const handleSelect = useCallback(
    (row: number, col: number, withShift: boolean) => {
      if (withShift) {
        dispatch(
          selectRange({
            start: selectedCell,
            end: {
              row,
              col,
            },
          }),
        );
      } else {
        dispatch(
          selectCell({
            row,
            col,
          }),
        );
      }

      setContextMenu(null);
      wrapperRef.current?.focus();
    },
    [dispatch, selectedCell],
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

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      dispatch(
        changeCell({
          row,
          col,
          value,
        }),
      );
    },
    [dispatch],
  );

  const handleAddRow = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    dispatch(
      addRow({
        row: contextMenu.row,
      }),
    );

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleDeleteRow = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    dispatch(
      deleteRow({
        row: contextMenu.row,
      }),
    );


    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleAddColumn = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    dispatch(
      addColumn({
        col: contextMenu.col,
      }),
    );

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleDeleteColumn = useCallback(() => {
    if (contextMenu === null) {
      return;
    }

    dispatch(
      deleteColumn({
        col: contextMenu.col,
      }),
    );

    setContextMenu(null);
  }, [contextMenu, dispatch]);

  const handleColumnResizeStart = useCallback(
    (col: number, startX: number) => {
      const startWidth = columnWidths[col] ?? DEFAULT_COLUMN_WIDTH;

      setResizingColumn({
        col,
        startX,
        startWidth,
      });
    },
    [columnWidths],
  );

  const handleRowResizeStart = useCallback(
    (row: number, startY: number) => {
      const startHeight = rowHeights[row] ?? DEFAULT_ROW_HEIGHT;

      setResizingRow({
        row,
        startY,
        startHeight,
      });
    },
    [rowHeights],
  );

  useEffect(() => {
    if (resizingColumn === null) {
      return;
    }

    const currentResizingColumn = resizingColumn;

    function handleMouseMove(event: globalThis.MouseEvent) {
      const difference = event.clientX - currentResizingColumn.startX;
      const newWidth = Math.max(
        MIN_COLUMN_WIDTH,
        currentResizingColumn.startWidth + difference,
      );

      setColumnWidths((oldWidths) => {
        const newWidths: number[] = [];

        for (let i = 0; i < oldWidths.length; i++) {
          if (i === currentResizingColumn.col) {
            newWidths.push(newWidth);
          } else {
            newWidths.push(oldWidths[i]);
          }
        }

        return newWidths;
      });
    }

    function handleMouseUp() {
      setResizingColumn(null);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn]);

  useEffect(() => {
    if (resizingRow === null) {
      return;
    }

    const currentResizingRow = resizingRow;

    function handleMouseMove(event: globalThis.MouseEvent) {
      const difference = event.clientY - currentResizingRow.startY;
      const newHeight = Math.max(MIN_ROW_HEIGHT, currentResizingRow.startHeight + difference);

      setRowHeights((oldHeights) => {
        const newHeights: number[] = [];

        for (let i = 0; i < oldHeights.length; i++) {
          if (i === currentResizingRow.row) {
            newHeights.push(newHeight);
          } else {
            newHeights.push(oldHeights[i]);
          }
        }

        return newHeights;
      });
    }

    function handleMouseUp() {
      setResizingRow(null);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingRow]);

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
      <FormulaBar value={activeCell?.value ?? ''} />

      <FormattingToolbar />

      <div className="table-scroll" onScroll={handleScroll}>
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="corner-cell"></th>

              {columnNames.map((name, colIndex) => (
                <th
                  key={name}
                  className="column-header"
                  style={{
                    width: columnWidths[colIndex] ?? DEFAULT_COLUMN_WIDTH,
                    minWidth: columnWidths[colIndex] ?? DEFAULT_COLUMN_WIDTH,
                  }}
                >
                  {name}

                  <span
                    className="column-resize-handle"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleColumnResizeStart(colIndex, event.clientX);
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {topPadding > 0 && (
              <tr className="virtual-spacer-row">
                <td
                  className="virtual-spacer-cell"
                  colSpan={columnNames.length + 1}
                  style={{
                    height: topPadding,
                  }}
                />
              </tr>
            )}

            {visibleTableRows.map((row, rowOffset) => {
              const rowIndex = visibleRows.start + rowOffset;

              return (
                <tr key={rowIndex}>
                  <th
                    className="row-header"
                    style={{
                      height: rowHeights[rowIndex] ?? DEFAULT_ROW_HEIGHT,
                    }}
                  >
                    {rowIndex + 1}

                    <span
                      className="row-resize-handle"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        handleRowResizeStart(rowIndex, event.clientY);
                      }}
                    />
                  </th>

                  {row.map((cell, colIndex) => (
                    <SpreadsheetCell
                      key={colIndex}
                      cell={cell}
                      row={rowIndex}
                      col={colIndex}
                      width={columnWidths[colIndex] ?? DEFAULT_COLUMN_WIDTH}
                      height={rowHeights[rowIndex] ?? DEFAULT_ROW_HEIGHT}
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
              );
            })}


            {bottomPadding > 0 && (
              <tr className="virtual-spacer-row">
                <td
                  className="virtual-spacer-cell"
                  colSpan={columnNames.length + 1}
                  style={{
                    height: bottomPadding,
                  }}
                />
              </tr>
            )}
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