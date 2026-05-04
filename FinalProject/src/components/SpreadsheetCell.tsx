import { memo, useEffect, useState } from 'react';
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
  const [editValue, setEditValue] = useState(cell.value);

  useEffect(() => {
    if (isEditing) {
      setEditValue(cell.value);
    }
  }, [isEditing, cell.value]);

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
    onChange(row, col, editValue);
    onStopEdit();
  }

  function cancelEditing() {
    setEditValue(cell.value);
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
          className="cell-input"
          value={editValue}
          autoFocus
          onChange={(event) => setEditValue(event.target.value)}
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