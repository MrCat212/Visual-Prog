import { memo, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import type { Cell } from '@/types/spreadsheet';
import { createDefaultCellStyle } from '@/utils/tableUtils';

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
  const style = cell.style ?? createDefaultCellStyle();

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

  function getDisplayedValue(): string {
    const rawValue = cell.result || cell.value;

    if (style.numberFormat === 'normal') {
      return rawValue;
    }

    const number = Number(rawValue);

    if (style.numberFormat === 'percent') {
      if (Number.isNaN(number)) {
        return rawValue;
      }

      return `${number * 100}%`;
    }

    if (style.numberFormat === 'currency') {
      if (Number.isNaN(number)) {
        return rawValue;
      }

      return `${number.toLocaleString('ru-RU')} ₽`;
    }

    if (style.numberFormat === 'date') {
      const date = new Date(rawValue);

      if (Number.isNaN(date.getTime())) {
        return rawValue;
      }

      return date.toLocaleDateString('ru-RU');
    }

    return rawValue;
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
        fontWeight: style.isBold ? 'bold' : 'normal',
        fontStyle: style.isItalic ? 'italic' : 'normal',
        textDecoration: style.isUnderline ? 'underline' : 'none',
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        textAlign: style.textAlign,
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
          style={{
            fontWeight: style.isBold ? 'bold' : 'normal',
            fontStyle: style.isItalic ? 'italic' : 'normal',
            textDecoration: style.isUnderline ? 'underline' : 'none',
            backgroundColor: style.backgroundColor,
            color: style.textColor,
            textAlign: style.textAlign,
          }}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
        />
      ) : (
        getDisplayedValue()
      )}
    </td>
  );
}

export default memo(SpreadsheetCell);