import { memo, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type { Cell } from '@/types/spreadsheet';

type SpreadsheetCellProps = {
  cell: Cell;
  row: number;
  col: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (row: number, col: number) => void;
  onChange: (row: number, col: number, value: string) => void;
  onStartEdit: (row: number, col: number) => void;
  onStopEdit: () => void;
};

function SpreadsheetCell({
  cell,
  row,
  col,
  isSelected,
  isEditing,
  onSelect,
  onChange,
  onStartEdit,
  onStopEdit,
}: SpreadsheetCellProps) {
  const [editValue, setEditValue] = useState(cell.value);

  useEffect(() => {
    if (isEditing) {
      setEditValue(cell.value);
    }
  }, [isEditing, cell.value]);

  function handleClick() {
    onSelect(row, col);
  }

  function handleDoubleClick() {
    onSelect(row, col);
    onStartEdit(row, col);
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

  if (isSelected) {
    cellClassName += ' selected-cell';
  }

  return (
    <td className={cellClassName} onClick={handleClick} onDoubleClick={handleDoubleClick}>
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