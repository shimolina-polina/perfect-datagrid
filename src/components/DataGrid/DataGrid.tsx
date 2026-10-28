import { useCallback, useMemo, useState } from 'react';
import { DataGridBody } from './DataGridBody';
import { DataGridHeader } from './DataGridHeader';
import type { DataGridColumn, DataGridProps, RowId, SortState } from './types';
import { compareValues, moveItem } from './utils';
import './DataGrid.css';

export function DataGrid<T>({
  rows,
  columns,
  getRowId,
  emptyMessage = 'No data',
  caption,
  className,
  striped = false,
  selectionMode = 'none',
  selectedRowIds,
  defaultSelectedRowIds,
  onSelectionChange,
  isRowSelected: isExternallySelected,
  onRowClick,
  resizableColumns = false,
  minColumnWidth = 80,
  reorderableColumns = false,
}: DataGridProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<ReadonlyArray<RowId>>(
    () => defaultSelectedRowIds ?? [],
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [columnOrder, setColumnOrder] = useState<ReadonlyArray<string>>(() =>
    columns.map((column) => column.id),
  );
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((column) => [column.id, column] as const));
    const orderedIds = columnOrder.filter((id) => byId.has(id));
    const missingIds = columns
      .map((column) => column.id)
      .filter((id) => !orderedIds.includes(id));

    return [...orderedIds, ...missingIds]
      .map((id) => byId.get(id))
      .filter((column): column is DataGridColumn<T> => column !== undefined);
  }, [columns, columnOrder]);

  const isControlled = selectedRowIds !== undefined;
  const selectedIds = isControlled ? selectedRowIds : internalSelectedIds;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const resolveRowId = useCallback(
    (row: T, index: number): RowId => (getRowId ? getRowId(row, index) : index),
    [getRowId],
  );

  const sortedRows = useMemo(() => {
    if (!sort) return [...rows];

    const column = columns.find((item) => item.id === sort.columnId);
    const accessor = column?.sortAccessor;
    if (!accessor) return [...rows];

    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compareValues(accessor(a), accessor(b)) * factor);
  }, [rows, columns, sort]);

  const isRowSelected = (row: T, index: number) =>
    Boolean(isExternallySelected?.(row, index)) ||
    selectedIdSet.has(resolveRowId(row, index));

  const updateSelection = (nextIds: RowId[]) => {
    if (!isControlled) {
      setInternalSelectedIds(nextIds);
    }

    if (onSelectionChange) {
      const nextIdSet = new Set(nextIds);
      const selectedRows = rows.filter((row, index) =>
        nextIdSet.has(resolveRowId(row, index)),
      );
      onSelectionChange(nextIds, selectedRows);
    }
  };

  const toggleRow = (row: T, index: number) => {
    if (selectionMode === 'none') return;

    const rowId = resolveRowId(row, index);

    if (selectionMode === 'single') {
      updateSelection([rowId]);
      return;
    }

    updateSelection(
      selectedIdSet.has(rowId)
        ? selectedIds.filter((id) => id !== rowId)
        : [...selectedIds, rowId],
    );
  };

  const allSelected =
    sortedRows.length > 0 &&
    sortedRows.every((row, index) => selectedIdSet.has(resolveRowId(row, index)));
  const someSelected =
    !allSelected &&
    sortedRows.some((row, index) => selectedIdSet.has(resolveRowId(row, index)));

  const toggleAll = () => {
    if (selectionMode !== 'multiple') return;

    updateSelection(
      allSelected ? [] : sortedRows.map((row, index) => resolveRowId(row, index)),
    );
  };

  const resizeColumn = useCallback((columnId: string, width: number) => {
    setColumnWidths((current) =>
      current[columnId] === width ? current : { ...current, [columnId]: width },
    );
  }, []);

  const resetColumnWidth = useCallback((columnId: string) => {
    setColumnWidths((current) => {
      if (!(columnId in current)) return current;
      const next = { ...current };
      delete next[columnId];
      return next;
    });
  }, []);

  const moveColumnTo = useCallback(
    (sourceId: string, targetId: string) => {
      setColumnOrder(() => {
        const ids = orderedColumns.map((column) => column.id);
        return moveItem(ids, ids.indexOf(sourceId), ids.indexOf(targetId));
      });
    },
    [orderedColumns],
  );

  const moveColumnBy = useCallback(
    (columnId: string, offset: number) => {
      setColumnOrder(() => {
        const ids = orderedColumns.map((column) => column.id);
        const from = ids.indexOf(columnId);
        return moveItem(ids, from, from + offset);
      });
    },
    [orderedColumns],
  );

  const handleColumnDragStart = useCallback((columnId: string) => {
    setDraggedColumnId(columnId);
  }, []);

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumnId(null);
    setDragOverColumnId(null);
  }, []);

  const handleColumnDragOver = useCallback((columnId: string) => {
    setDragOverColumnId((current) => (current === columnId ? current : columnId));
  }, []);

  const handleColumnDragLeave = useCallback((columnId: string) => {
    setDragOverColumnId((current) => (current === columnId ? null : current));
  }, []);

  const handleColumnDrop = useCallback(
    (targetId: string) => {
      if (draggedColumnId && draggedColumnId !== targetId) {
        moveColumnTo(draggedColumnId, targetId);
      }
      setDraggedColumnId(null);
      setDragOverColumnId(null);
    },
    [draggedColumnId, moveColumnTo],
  );

  const toggleSort = (column: DataGridColumn<T>) => {
    if (!column.sortAccessor) return;

    setSort((current) => {
      if (current?.columnId !== column.id) {
        return { columnId: column.id, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { columnId: column.id, direction: 'desc' };
      }
      return null;
    });
  };

  const rootClassName = ['pdg', striped && 'pdg--striped', onRowClick && 'pdg--clickable', className]
    .filter(Boolean)
    .join(' ');
  const tableClassName = ['pdg__table', resizableColumns && 'pdg__table--resizable']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <div className="pdg__scroll">
        <table className={tableClassName}>
          {caption ? <caption className="pdg__caption">{caption}</caption> : null}
          <colgroup>
            {selectionMode === 'multiple' ? <col className="pdg__col-select" /> : null}
            {orderedColumns.map((column) => {
              const width = columnWidths[column.id] ?? column.width;
              return <col key={column.id} style={width === undefined ? undefined : { width }} />;
            })}
          </colgroup>
          <DataGridHeader
            columns={orderedColumns}
            sort={sort}
            selectionMode={selectionMode}
            allSelected={allSelected}
            someSelected={someSelected}
            resizableColumns={resizableColumns}
            reorderableColumns={reorderableColumns}
            minColumnWidth={minColumnWidth}
            draggedColumnId={draggedColumnId}
            dragOverColumnId={dragOverColumnId}
            onToggleSort={toggleSort}
            onToggleAll={toggleAll}
            onResizeColumn={resizeColumn}
            onResetColumnWidth={resetColumnWidth}
            onColumnDragStart={handleColumnDragStart}
            onColumnDragEnd={handleColumnDragEnd}
            onColumnDragOver={handleColumnDragOver}
            onColumnDragLeave={handleColumnDragLeave}
            onColumnDrop={handleColumnDrop}
            onMoveColumn={moveColumnBy}
          />
          <DataGridBody
            rows={sortedRows}
            columns={orderedColumns}
            getRowId={getRowId}
            emptyMessage={emptyMessage}
            selectionMode={selectionMode}
            isRowSelected={isRowSelected}
            onToggleSelect={toggleRow}
            onRowClick={onRowClick}
          />
        </table>
      </div>
    </div>
  );
}
