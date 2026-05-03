import { useCallback, useMemo, useState } from 'react';

import FormulaBar from '@/components/FormulaBar';
import SpreadsheetCell from '@/components/SpreadsheetCell';
import type { Cell, SelectedCell, TableData } from '@/types/spreadsheet';
import { createTable, getColumnName } from '@/utils/tableUtils';
import { recalculateTable } from '@/utils/formulaUtils';

const ROWS = 100;
const COLS = 26;

function SpreadsheetTable() {
  const [table, setTable] = useState<TableData>(() => createTable(ROWS, COLS));

  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    row: 0,
    col: 0,
  });

  const columnNames = useMemo(() => {
    const names: string[] = [];

    for (let i = 0; i < COLS; i++) {
      names.push(getColumnName(i));
    }

    return names;
  }, []);

  const activeCell = table[selectedCell.row][selectedCell.col];

  const handleSelect = useCallback((row: number, col: number) => {
    setSelectedCell({
      row,
      col,
    });
  }, []);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setTable((oldTable) => {
      const newTable: TableData = [];
  
      for (let i = 0; i < oldTable.length; i++) {
        const newRow: Cell[] = [];
  
        for (let j = 0; j < oldTable[i].length; j++) {
          if (i === row && j === col) {
            newRow.push({
              value,
              result: value,
              type: 'text',
            });
          } else {
            newRow.push(oldTable[i][j]);
          }
        }
  
        newTable.push(newRow);
      }
  
      return recalculateTable(newTable);
    });
  }, []);

  return (
    <div className="spreadsheet-wrapper">
      <FormulaBar value={activeCell.value} />

      <div className="table-scroll">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="corner-cell"></th>

              {columnNames.map((name) => (
                <th key={name} className="column-header">
                  {name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {table.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <th className="row-header">{rowIndex + 1}</th>

                {row.map((cell, colIndex) => (
                  <SpreadsheetCell
                    key={colIndex}
                    cell={cell}
                    row={rowIndex}
                    col={colIndex}
                    isSelected={selectedCell.row === rowIndex && selectedCell.col === colIndex}
                    onSelect={handleSelect}
                    onChange={handleCellChange}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SpreadsheetTable;