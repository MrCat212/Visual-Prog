import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent, MouseEvent, UIEvent } from 'react';

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
  pasteCells,
  redo,
  selectAllCells,
  selectCell,
  selectRange,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  undo,
} from '@/features/spreadsheet/spreadsheetSlice';
import type { CellStyle, SelectedCell } from '@/types/spreadsheet';
import { createDefaultCellStyle, getColumnName } from '@/utils/tableUtils';

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

type ClipboardCell = {
  value: string;
  style: CellStyle | null;
};

type InternalClipboard = {
  text: string;
  cells: ClipboardCell[][];
};

function SpreadsheetTable() {
  const dispatch = useAppDispatch();

  const table = useAppSelector((state) => state.spreadsheet.table);
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);
  const selectedRange = useAppSelector((state) => state.spreadsheet.selectedRange);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const internalClipboardRef = useRef<InternalClipboard | null>(null);

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

  const columnOffsets = useMemo(() => {
    const offsets: number[] = [0];

    for (let i = 0; i < columnCount; i++) {
      offsets.push(offsets[i] + (columnWidths[i] ?? DEFAULT_COLUMN_WIDTH));
    }

    return offsets;
  }, [columnCount, columnWidths]);

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

  const getCellStyle = useCallback(
    (row: number, col: number): CellStyle => {
      return table[row]?.[col]?.style ?? createDefaultCellStyle();
    },
    [table],
  );

  const scrollCellIntoView = useCallback(
    (row: number, col: number) => {
      const scrollElement = tableScrollRef.current;

      if (scrollElement === null) {
        return;
      }

      const cellTop = rowOffsets[row] ?? 0;
      const cellBottom = rowOffsets[row + 1] ?? cellTop + DEFAULT_ROW_HEIGHT;
      const cellLeft = columnOffsets[col] ?? 0;
      const cellRight = columnOffsets[col + 1] ?? cellLeft + DEFAULT_COLUMN_WIDTH;

      const visibleTop = scrollElement.scrollTop;
      const visibleBottom = visibleTop + scrollElement.clientHeight;
      const visibleLeft = scrollElement.scrollLeft;
      const visibleRight = visibleLeft + scrollElement.clientWidth;

      if (cellTop < visibleTop) {
        scrollElement.scrollTop = cellTop;
      } else if (cellBottom > visibleBottom) {
        scrollElement.scrollTop = cellBottom - scrollElement.clientHeight;
      }

      if (cellLeft < visibleLeft) {
        scrollElement.scrollLeft = cellLeft;
      } else if (cellRight > visibleRight) {
        scrollElement.scrollLeft = cellRight - scrollElement.clientWidth;
      }
    },
    [columnOffsets, rowOffsets],
  );

  const moveSelection = useCallback(
    (row: number, col: number, isBackward: boolean) => {
      const rowCount = table.length;
      const colCount = table[0]?.length ?? 0;

      if (rowCount === 0 || colCount === 0) {
        return;
      }

      let nextRow = row;
      let nextCol = col;

      if (isBackward) {
        nextCol--;

        if (nextCol < 0) {
          nextRow--;
          nextCol = colCount - 1;
        }

        if (nextRow < 0) {
          nextRow = 0;
          nextCol = 0;
        }
      } else {
        nextCol++;

        if (nextCol >= colCount) {
          nextRow++;
          nextCol = 0;
        }

        if (nextRow >= rowCount) {
          nextRow = rowCount - 1;
          nextCol = colCount - 1;
        }
      }

      dispatch(
        selectCell({
          row: nextRow,
          col: nextCol,
        }),
      );

      wrapperRef.current?.focus();
      scrollCellIntoView(nextRow, nextCol);
    },
    [dispatch, scrollCellIntoView, table],
  );

  const moveSelectionByOffset = useCallback(
    (rowOffset: number, colOffset: number) => {
      const rowCount = table.length;
      const colCount = table[0]?.length ?? 0;

      if (rowCount === 0 || colCount === 0) {
        return;
      }

      const nextRow = Math.min(Math.max(selectedCell.row + rowOffset, 0), rowCount - 1);
      const nextCol = Math.min(Math.max(selectedCell.col + colOffset, 0), colCount - 1);

      dispatch(
        selectCell({
          row: nextRow,
          col: nextCol,
        }),
      );

      wrapperRef.current?.focus();
      scrollCellIntoView(nextRow, nextCol);
    },
    [dispatch, scrollCellIntoView, selectedCell, table],
  );

  const getSelectedCellsData = useCallback((): ClipboardCell[][] => {
    if (selectedRange === null) {
      return [
        [
          {
            value: table[selectedCell.row]?.[selectedCell.col]?.value ?? '',
            style: getCellStyle(selectedCell.row, selectedCell.col),
          },
        ],
      ];
    }

    const startRow = Math.min(selectedRange.start.row, selectedRange.end.row);
    const endRow = Math.max(selectedRange.start.row, selectedRange.end.row);
    const startCol = Math.min(selectedRange.start.col, selectedRange.end.col);
    const endCol = Math.max(selectedRange.start.col, selectedRange.end.col);

    const rows: ClipboardCell[][] = [];

    for (let row = startRow; row <= endRow; row++) {
      const values: ClipboardCell[] = [];

      for (let col = startCol; col <= endCol; col++) {
        values.push({
          value: table[row]?.[col]?.value ?? '',
          style: getCellStyle(row, col),
        });
      }

      rows.push(values);
    }

    return rows;
  }, [getCellStyle, selectedCell, selectedRange, table]);

  const getSelectedCellsText = useCallback((): string => {
    const cells = getSelectedCellsData();
    const rows: string[] = [];

    for (let row = 0; row < cells.length; row++) {
      const values: string[] = [];

      for (let col = 0; col < cells[row].length; col++) {
        values.push(cells[row][col].value);
      }

      rows.push(values.join('\t'));
    }

    return rows.join('\n');
  }, [getSelectedCellsData]);

  const parseClipboardText = useCallback((text: string): ClipboardCell[][] => {
    const lines = text.split(/\r?\n/);
    const cells: ClipboardCell[][] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '') {
        continue;
      }

      const rowValues = lines[i].split('\t');
      const row: ClipboardCell[] = [];

      for (let j = 0; j < rowValues.length; j++) {
        row.push({
          value: rowValues[j],
          style: null,
        });
      }

      cells.push(row);
    }

    return cells;
  }, []);

  useEffect(() => {
    scrollCellIntoView(selectedCell.row, selectedCell.col);
  }, [scrollCellIntoView, selectedCell]);

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

    function isInteractiveTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName;

      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        tagName === 'BUTTON'
      );
    }

    function handleWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (editingCell !== null) {
        return;
      }

      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSelectionByOffset(-1, 0);
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSelectionByOffset(1, 0);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveSelectionByOffset(0, -1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveSelectionByOffset(0, 1);
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        moveSelection(selectedCell.row, selectedCell.col, event.shiftKey);
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
  }, [dispatch, editingCell, moveSelection, moveSelectionByOffset, selectedCell]);

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
      scrollCellIntoView(row, col);
    },
    [dispatch, scrollCellIntoView, selectedCell],
  );

  const handleStartEdit = useCallback((row: number, col: number) => {
    setEditingCell({
      row,
      col,
    });
  }, []);

  const handleStopEdit = useCallback(() => {
    setEditingCell(null);

    window.setTimeout(() => {
      wrapperRef.current?.focus();
    }, 0);
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
      const newWidth = Math.max(MIN_COLUMN_WIDTH, currentResizingColumn.startWidth + difference);

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

  function handleCopy(event: ClipboardEvent<HTMLDivElement>) {
    if (editingCell !== null) {
      return;
    }

    event.preventDefault();

    const text = getSelectedCellsText();
    const cells = getSelectedCellsData();

    internalClipboardRef.current = {
      text,
      cells,
    };

    event.clipboardData.setData('text/plain', text);
  }

  function handleCut(event: ClipboardEvent<HTMLDivElement>) {
    if (editingCell !== null) {
      return;
    }

    event.preventDefault();

    const text = getSelectedCellsText();
    const cells = getSelectedCellsData();

    internalClipboardRef.current = {
      text,
      cells,
    };

    event.clipboardData.setData('text/plain', text);
    dispatch(clearSelectedCells());
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    if (editingCell !== null) {
      return;
    }

    event.preventDefault();

    const text = event.clipboardData.getData('text/plain');
    const internalClipboard = internalClipboardRef.current;

    const cells =
      internalClipboard !== null && internalClipboard.text === text
        ? internalClipboard.cells
        : parseClipboardText(text);

    if (cells.length === 0) {
      return;
    }

    dispatch(
      pasteCells({
        startRow: selectedCell.row,
        startCol: selectedCell.col,
        cells,
      }),
    );
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
      onCopy={handleCopy}
      onCut={handleCut}
      onPaste={handlePaste}
    >
      <FormulaBar value={activeCell?.value ?? ''} />

      <FormattingToolbar />

      <div className="table-scroll" ref={tableScrollRef} onScroll={handleScroll}>
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
                      onMoveSelection={moveSelection}
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
