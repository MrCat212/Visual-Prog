export type CellType = 'text' | 'number' | 'boolean' | 'formula';

export type Cell = {
  value: string;
  result: string;
  type: CellType;
};

export type TableData = Cell[][];

export type SelectedCell = {
  row: number;
  col: number;
};