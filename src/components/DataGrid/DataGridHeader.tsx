import { ColumnDragHandle } from './ColumnDragHandle';
import { ColumnResizeHandle } from './ColumnResizeHandle';
import { SelectionCheckbox } from './SelectionCheckbox';
import type { DataGridColumn, SelectionMode, SortState } from './types';

interface DataGridHeaderProps<T> {
  columns: ReadonlyArray<DataGridColumn<T>>;
  sort: SortState | null;
  selectionMode: SelectionMode;
  allSelected: boolean;
  someSelected: boolean;
  resizableColumns: boolean;
  reorderableColumns: boolean;
  minColumnWidth: number;
  draggedColumnId: string | null;
  dragOverColumnId: string | null;
  onToggleSort: (column: DataGridColumn<T>) => void;
  onToggleAll: () => void;
  onResizeColumn: (columnId: string, width: number) => void;
  onResetColumnWidth: (columnId: string) => void;
  onColumnDragStart: (columnId: string) => void;
  onColumnDragEnd: () => void;
  onColumnDragOver: (columnId: string) => void;
  onColumnDragLeave: (columnId: string) => void;
  onColumnDrop: (columnId: string) => void;
  onMoveColumn: (columnId: string, offset: number) => void;
}

export function DataGridHeader<T>({
  columns,
  sort,
  selectionMode,
  allSelected,
  someSelected,
  resizableColumns,
  reorderableColumns,
  minColumnWidth,
  draggedColumnId,
  dragOverColumnId,
  onToggleSort,
  onToggleAll,
  onResizeColumn,
  onResetColumnWidth,
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
  onMoveColumn,
}: DataGridHeaderProps<T>) {
  return (
    <thead>
      <tr>
        {selectionMode === 'multiple' ? (
          <th scope="col" className="pdg__header pdg__select-cell">
            <SelectionCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              label="Select all rows"
              onChange={onToggleAll}
            />
          </th>
        ) : null}
        {columns.map((column) => {
          const direction = sort && sort.columnId === column.id ? sort.direction : null;
          const isSortable = Boolean(column.sortAccessor);
          const isResizable = resizableColumns && column.resizable !== false;
          const headerClassName = [
            'pdg__header',
            draggedColumnId === column.id && 'pdg__header--dragging',
            dragOverColumnId === column.id && 'pdg__header--drag-over',
          ]
            .filter(Boolean)
            .join(' ');
          const ariaSort = direction
            ? direction === 'asc'
              ? 'ascending'
              : 'descending'
            : isSortable
              ? 'none'
              : undefined;

          return (
            <th
              key={column.id}
              scope="col"
              className={headerClassName}
              style={{ textAlign: column.align }}
              aria-sort={ariaSort}
              onDragOver={
                reorderableColumns
                  ? (event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      onColumnDragOver(column.id);
                    }
                  : undefined
              }
              onDragLeave={
                reorderableColumns
                  ? (event) => {
                      const nextTarget = event.relatedTarget as Node | null;
                      if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                        onColumnDragLeave(column.id);
                      }
                    }
                  : undefined
              }
              onDrop={
                reorderableColumns
                  ? (event) => {
                      event.preventDefault();
                      onColumnDrop(column.id);
                    }
                  : undefined
              }
            >
              {reorderableColumns ? (
                <ColumnDragHandle
                  columnId={column.id}
                  label={`Reorder ${column.id} column`}
                  onDragStart={onColumnDragStart}
                  onDragEnd={onColumnDragEnd}
                  onMove={onMoveColumn}
                />
              ) : null}
              {isSortable ? (
                <button
                  type="button"
                  className="pdg__sort-button"
                  onClick={() => onToggleSort(column)}
                >
                  <span>{column.header}</span>
                  <span className="pdg__sort-icon" aria-hidden="true">
                    {direction ? (direction === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </button>
              ) : (
                column.header
              )}
              {isResizable ? (
                <ColumnResizeHandle
                  columnId={column.id}
                  label={`Resize ${column.id} column`}
                  minWidth={minColumnWidth}
                  onResize={onResizeColumn}
                  onReset={onResetColumnWidth}
                />
              ) : null}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
