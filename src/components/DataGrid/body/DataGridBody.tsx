import type { ReactNode } from 'react';
import { DataGridRow } from './DataGridRow';
import type { DataGridColumn, PinnedOffsets, SelectionMode } from '../types';

interface DataGridBodyProps<T> {
  rows: readonly T[];
  columns: ReadonlyArray<DataGridColumn<T>>;
  getRowId?: (row: T, index: number) => string | number;
  emptyMessage: ReactNode;
  selectionMode: SelectionMode;
  isRowSelected: (row: T, index: number) => boolean;
  columnOffsets: PinnedOffsets;
  rowIndexOffset: number;
  onToggleSelect: (row: T, index: number) => void;
  onRowClick?: (row: T, index: number) => void;
}

export function DataGridBody<T>({
  rows,
  columns,
  getRowId,
  emptyMessage,
  selectionMode,
  isRowSelected,
  columnOffsets,
  rowIndexOffset,
  onToggleSelect,
  onRowClick,
}: DataGridBodyProps<T>) {
  const columnCount = columns.length + (selectionMode === 'multiple' ? 1 : 0);

  return (
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td className="pdg__empty" colSpan={columnCount}>
            {emptyMessage}
          </td>
        </tr>
      ) : (
        rows.map((row, index) => {
          const rowIndex = rowIndexOffset + index;

          return (
            <DataGridRow
              key={getRowId ? getRowId(row, rowIndex) : rowIndex}
              row={row}
              rowIndex={rowIndex}
              columns={columns}
              selected={isRowSelected(row, rowIndex)}
              selectionMode={selectionMode}
              columnOffsets={columnOffsets}
              onToggleSelect={onToggleSelect}
              onRowClick={onRowClick}
            />
          );
        })
      )}
    </tbody>
  );
}
