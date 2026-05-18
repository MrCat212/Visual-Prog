import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setBackgroundColor,
  setNumberFormat,
  setTextAlign,
  setTextColor,
  toggleBold,
  toggleItalic,
  toggleUnderline,
} from '@/features/spreadsheet/spreadsheetSlice';
import type { NumberFormat, TextAlign } from '@/types/spreadsheet';
import { createDefaultCellStyle } from '@/utils/tableUtils';

function FormattingToolbar() {
  const dispatch = useAppDispatch();

  const table = useAppSelector((state) => state.spreadsheet.table);
  const selectedCell = useAppSelector((state) => state.spreadsheet.selectedCell);

  const activeCell = table[selectedCell.row]?.[selectedCell.col];
  const activeStyle = activeCell?.style ?? createDefaultCellStyle();

  function handleTextColorChange(color: string) {
    dispatch(
      setTextColor({
        color,
      }),
    );
  }

  function handleBackgroundColorChange(color: string) {
    dispatch(
      setBackgroundColor({
        color,
      }),
    );
  }

  function handleTextAlignChange(textAlign: TextAlign) {
    dispatch(
      setTextAlign({
        textAlign,
      }),
    );
  }

  function handleNumberFormatChange(numberFormat: NumberFormat) {
    dispatch(
      setNumberFormat({
        numberFormat,
      }),
    );
  }

  return (
    <div className="formatting-toolbar">
      <button
        type="button"
        className={activeStyle.isBold ? 'toolbar-button active' : 'toolbar-button'}
        onClick={() => dispatch(toggleBold())}
      >
        Ж
      </button>

      <button
        type="button"
        className={activeStyle.isItalic ? 'toolbar-button active' : 'toolbar-button'}
        onClick={() => dispatch(toggleItalic())}
      >
        К
      </button>

      <button
        type="button"
        className={activeStyle.isUnderline ? 'toolbar-button active' : 'toolbar-button'}
        onClick={() => dispatch(toggleUnderline())}
      >
        Ч
      </button>

      <label className="toolbar-label">
        Текст
        <input
          type="color"
          value={activeStyle.textColor}
          onChange={(event) => handleTextColorChange(event.target.value)}
        />
      </label>

      <label className="toolbar-label">
        Фон
        <input
          type="color"
          value={activeStyle.backgroundColor}
          onChange={(event) => handleBackgroundColorChange(event.target.value)}
        />
      </label>

      <select
        value={activeStyle.textAlign}
        onChange={(event) => handleTextAlignChange(event.target.value as TextAlign)}
      >
        <option value="left">Слева</option>
        <option value="center">Центр</option>
        <option value="right">Справа</option>
      </select>

      <select
        value={activeStyle.numberFormat}
        onChange={(event) => handleNumberFormatChange(event.target.value as NumberFormat)}
      >
        <option value="normal">Обычный</option>
        <option value="percent">Процент</option>
        <option value="currency">Валюта</option>
        <option value="date">Дата</option>
      </select>
    </div>
  );
}

export default FormattingToolbar;
