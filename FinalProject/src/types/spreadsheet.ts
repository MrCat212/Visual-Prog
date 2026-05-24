export type CellType = 'text' | 'number' | 'boolean' | 'formula';

export type TextAlign = 'left' | 'center' | 'right';

export type NumberFormat = 'normal' | 'percent' | 'currency' | 'date';

export type CellStyle = {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  backgroundColor: string;
  textColor: string;
  textAlign: TextAlign;
  numberFormat: NumberFormat;
};

export type Cell = {
  value: string;
  result: string;
  type: CellType;
  style: CellStyle;
};

export type TableData = Cell[][];

export type SelectedCell = {
  row: number;
  col: number;
};

export type SelectedRange = {
  start: SelectedCell;
  end: SelectedCell;
};
