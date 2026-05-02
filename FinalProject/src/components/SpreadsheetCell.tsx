import { memo, useState } from 'react';
import type { KeyboardEvent } from 'react';

import type { Cell } from '@/types/spreadsheet';

type SpreadsheetCellProps = {
  cell: Cell;
  row: number;
  col: number;
  isSelected: boolean;
  onSelect: (row: number, col: number) => void;
  onChange: (row: number, col: number, value: string) => void;
};

function SpreadsheetCell({
  cell,
  row,
  col,
  isSelected,
  onSelect,
  onChange,
}: SpreadsheetCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(cell.value);

  function handleClick() {
    onSelect(row, col);
  }

  function handleDoubleClick() {
    setEditValue(cell.value);
    setIsEditing(true);
  }

  function finishEditing() {
    onChange(row, col, editValue);
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      finishEditing();
    }

    if (event.key === 'Escape') {
      setEditValue(cell.value);
      setIsEditing(false);
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