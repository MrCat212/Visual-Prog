import { useCallback, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

import FormulaBar from '@/components/FormulaBar';
import SpreadsheetCell from '@/components/SpreadsheetCell';
import type { Cell, SelectedCell, TableData } from '@/types/spreadsheet';
import { recalculateTable } from '@/utils/formulaUtils';
import { createTable, getColumnName } from '@/utils/tableUtils';

const ROWS = 100;
const COLS = 26;

function SpreadsheetTable() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [table, setTable] = useState<TableData>(() => createTable(ROWS, COLS));

  const [selectedCell, setSelectedCell] = useState<SelectedCell>({
    row: 0,
    col: 0,
  });

  const [editingCell, setEditingCell] = useState<SelectedCell | null>(null);

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

    wrapperRef.current?.focus();
  }, []);

  const handleStartEdit = useCallback((row: number, col: number) => {
    setEditingCell({
      row,
      col,
    });
  }, []);

  const handleStopEdit = useCallback(() => {
    setEditingCell(null);
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

  const handleTableKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && editingCell === null) {
        event.preventDefault();

        setEditingCell({
          row: selectedCell.row,
          col: selectedCell.col,
        });
      }
    },
    [editingCell, selectedCell],
  );

  return (
    <div
      className="spreadsheet-wrapper"
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleTableKeyDown}
    >
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
                    isEditing={
                      editingCell !== null &&
                      editingCell.row === rowIndex &&
                      editingCell.col === colIndex
                    }
                    onSelect={handleSelect}
                    onChange={handleCellChange}
                    onStartEdit={handleStartEdit}
                    onStopEdit={handleStopEdit}
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