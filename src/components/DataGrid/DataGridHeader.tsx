import { ColumnDragHandle } from './ColumnDragHandle';
import { ColumnMenu } from './ColumnMenu';
import { ColumnResizeHandle } from './ColumnResizeHandle';
import { SelectionCheckbox } from './SelectionCheckbox';
import type { DataGridColumn, PinnedOffsets, SelectionMode, SortState } from './types';
import { SELECTION_COLUMN_ID } from './utils';

interface DataGridHeaderProps<T> {
  columns: ReadonlyArray<DataGridColumn<T>>;
  sort: SortState | null;
  selectionMode: SelectionMode;
  allSelected: boolean;
  someSelected: boolean;
  resizableColumns: boolean;
  reorderableColumns: boolean;
  filterableColumns: boolean;
  filters: Record<string, string>;
  minColumnWidth: number;
  draggedColumnId: string | null;
  dragOverColumnId: string | null;
  pinnedOffsets: PinnedOffsets;
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
  onTogglePin: (columnId: string) => void;
  onFilterChange: (columnId: string, value: string) => void;
}

export function DataGridHeader<T>({
  columns,
  sort,
  selectionMode,
  allSelected,
  someSelected,
  resizableColumns,
  reorderableColumns,
  filterableColumns,
  filters,
  minColumnWidth,
  draggedColumnId,
  dragOverColumnId,
  pinnedOffsets,
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
  onTogglePin,
  onFilterChange,
}: DataGridHeaderProps<T>) {
  const showFilterRow =
    filterableColumns &&
    columns.some(
      (column) =>
        column.filterable !== false && Boolean(column.filterAccessor ?? column.sortAccessor),
    );

  return (
    <thead>
      <tr>
        {selectionMode === 'multiple' ? (
          <th
            scope="col"
            data-column-id={SELECTION_COLUMN_ID}
            className="pdg__header pdg__select-cell pdg__header--pinned pdg__header--pinned-left"
            style={{ left: 0 }}
          >
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
          const pinOffset = pinnedOffsets[column.id];
          const pinnedClasses = column.pin
            ? [
                'pdg__header--pinned',
                `pdg__header--pinned-${column.pin}`,
                pinOffset?.edge && `pdg__header--pinned-${column.pin}-edge`,
              ]
            : [];
          const headerClassName = [
            'pdg__header',
            ...pinnedClasses,
            draggedColumnId === column.id && 'pdg__header--dragging',
            dragOverColumnId === column.id && 'pdg__header--drag-over',
          ]
            .filter(Boolean)
            .join(' ');
          const pinStyle = pinOffset
            ? pinOffset.side === 'left'
              ? { left: pinOffset.value }
              : { right: pinOffset.value }
            : undefined;
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
              data-column-id={column.id}
              className={headerClassName}
              style={{ textAlign: column.align, ...pinStyle }}
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
              <ColumnMenu
                columnId={column.id}
                pinned={Boolean(column.pin)}
                onTogglePin={onTogglePin}
              />
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
      {showFilterRow ? (
        <tr className="pdg__filter-row">
          {selectionMode === 'multiple' ? (
            <th
              scope="col"
              className="pdg__filter-cell pdg__filter-cell--pinned pdg__filter-cell--pinned-left"
              style={{ left: 0 }}
            />
          ) : null}
          {columns.map((column) => {
            const pinOffset = pinnedOffsets[column.id];
            const isFilterable =
              column.filterable !== false &&
              Boolean(column.filterAccessor ?? column.sortAccessor);
            const filterCellClassName = [
              'pdg__filter-cell',
              column.pin && 'pdg__filter-cell--pinned',
              column.pin && `pdg__filter-cell--pinned-${column.pin}`,
              column.pin && pinOffset?.edge && `pdg__filter-cell--pinned-${column.pin}-edge`,
            ]
              .filter(Boolean)
              .join(' ');
            const filterPinStyle = pinOffset
              ? pinOffset.side === 'left'
                ? { left: pinOffset.value }
                : { right: pinOffset.value }
              : undefined;

            return (
              <th
                key={column.id}
                scope="col"
                data-column-id={column.id}
                className={filterCellClassName}
                style={filterPinStyle}
              >
                {isFilterable ? (
                  <input
                    type="search"
                    className="pdg__filter-input"
                    aria-label={`Filter ${column.id} column`}
                    placeholder="Filter"
                    value={filters[column.id] ?? ''}
                    onChange={(event) => onFilterChange(column.id, event.target.value)}
                  />
                ) : null}
              </th>
            );
          })}
        </tr>
      ) : null}
    </thead>
  );
}
