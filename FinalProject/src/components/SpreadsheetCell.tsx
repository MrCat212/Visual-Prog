import { memo, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import type { Cell } from '@/types/spreadsheet';

type SpreadsheetCellProps = {
  cell: Cell;
  row: number;
  col: number;
  width: number;
  height: number;
  isSelected: boolean;
  isInSelectedRange: boolean;
  isEditing: boolean;
  onSelect: (row: number, col: number, withShift: boolean) => void;
  onChange: (row: number, col: number, value: string) => void;
  onStartEdit: (row: number, col: number) => void;
  onStopEdit: () => void;
  onOpenContextMenu: (row: number, col: number, x: number, y: number) => void;
};

function SpreadsheetCell({
  cell,
  row,
  col,
  width,
  height,
  isSelected,
  isInSelectedRange,
  isEditing,
  onSelect,
  onChange,
  onStartEdit,
  onStopEdit,
  onOpenContextMenu,
}: SpreadsheetCellProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleClick(event: MouseEvent<HTMLTableCellElement>) {
    onSelect(row, col, event.shiftKey);
  }

  function handleDoubleClick() {
    onSelect(row, col, false);
    onStartEdit(row, col);
  }

  function handleContextMenu(event: MouseEvent<HTMLTableCellElement>) {
    event.preventDefault();

    onSelect(row, col, false);
    onOpenContextMenu(row, col, event.clientX, event.clientY);
  }

  function finishEditing() {
    const value = inputRef.current?.value ?? cell.value;

    onChange(row, col, value);
    onStopEdit();
  }

  function cancelEditing() {
    onStopEdit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      finishEditing();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelEditing();
    }
  }

  let cellClassName = 'spreadsheet-cell';

  if (isInSelectedRange) {
    cellClassName += ' range-selected-cell';
  }

  if (isSelected) {
    cellClassName += ' selected-cell';
  }

  return (
    <td
      className={cellClassName}
      style={{
        width,
        minWidth: width,
        height,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className="cell-input"
          defaultValue={cell.value}
          autoFocus
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
        />
      ) : (
        cell.result || cell.value
      )}
    </td>
  );
}

export default memo(SpreadsheetCell);