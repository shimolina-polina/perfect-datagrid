import { useCallback, useId, useMemo, useState } from 'react';
import { DataGridBody } from './body/DataGridBody';
import { DataGridHeader } from './header/DataGridHeader';
import type {
  ColumnPin,
  ColumnPins,
  DataGridColumn,
  DataGridProps,
  PinnedOffsets,
  RowId,
  SortState,
} from './types';
import { useMeasuredColumnWidths } from './hooks/useMeasuredColumnWidths';
import { compareValues, matchesFilter, moveItem, SELECTION_COLUMN_ID } from './lib/utils';
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
  filterableColumns = false,
  sort: controlledSort,
  defaultSort,
  onSortChange,
  filters: controlledFilters,
  defaultFilters,
  onFiltersChange,
  columnOrder: controlledColumnOrder,
  defaultColumnOrder,
  onColumnOrderChange,
  columnPins: controlledColumnPins,
  defaultColumnPins,
  onColumnPinsChange,
}: DataGridProps<T>) {
  const captionId = useId();
  const [internalSort, setInternalSort] = useState<SortState | null>(() => defaultSort ?? null);
  const [internalFilters, setInternalFilters] = useState<Record<string, string>>(() => ({
    ...(defaultFilters ?? {}),
  }));
  const [internalSelectedIds, setInternalSelectedIds] = useState<ReadonlyArray<RowId>>(
    () => defaultSelectedRowIds ?? [],
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [internalColumnOrder, setInternalColumnOrder] = useState<ReadonlyArray<string>>(() =>
    defaultColumnOrder ? [...defaultColumnOrder] : columns.map((column) => column.id),
  );
  const [internalColumnPins, setInternalColumnPins] = useState<
    Record<string, ColumnPin | null>
  >(() => ({ ...(defaultColumnPins ?? {}) }));
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const sort = controlledSort !== undefined ? controlledSort : internalSort;
  const filters = controlledFilters !== undefined ? controlledFilters : internalFilters;
  const columnOrder =
    controlledColumnOrder !== undefined ? controlledColumnOrder : internalColumnOrder;
  const pinOverrides =
    controlledColumnPins !== undefined ? controlledColumnPins : internalColumnPins;

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

  const displayColumns = useMemo(() => {
    const left: DataGridColumn<T>[] = [];
    const center: DataGridColumn<T>[] = [];
    const right: DataGridColumn<T>[] = [];

    orderedColumns.forEach((column) => {
      const pin = column.id in pinOverrides ? pinOverrides[column.id] : column.pin;
      const resolvedColumn =
        pin === column.pin ? column : { ...column, pin: pin ?? undefined };

      if (pin === 'left') {
        left.push(resolvedColumn);
      } else if (pin === 'right') {
        right.push(resolvedColumn);
      } else {
        center.push(resolvedColumn);
      }
    });

    return [...left, ...center, ...right];
  }, [orderedColumns, pinOverrides]);

  const hasPinnedColumns = useMemo(
    () => displayColumns.some((column) => column.pin !== undefined),
    [displayColumns],
  );
  const columnIds = useMemo(
    () => [
      ...(selectionMode === 'multiple' ? [SELECTION_COLUMN_ID] : []),
      ...displayColumns.map((column) => column.id),
    ],
    [displayColumns, selectionMode],
  );
  const { tableRef, widths: measuredColumnWidths } = useMeasuredColumnWidths(
    hasPinnedColumns,
    columnIds,
  );

  const isControlled = selectedRowIds !== undefined;
  const selectedIds = isControlled ? selectedRowIds : internalSelectedIds;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const resolveRowId = useCallback(
    (row: T, index: number): RowId => (getRowId ? getRowId(row, index) : index),
    [getRowId],
  );

  const sortedRows = useMemo(() => {
    const activeFilters = filterableColumns
      ? Object.entries(filters).filter(([, value]) => value.trim() !== '')
      : [];

    const filterAccessors = new Map(
      columns
        .filter((column) => column.filterable !== false)
        .map((column) => [column.id, column.filterAccessor ?? column.sortAccessor] as const),
    );

    const filteredRows =
      activeFilters.length === 0
        ? rows
        : rows.filter((row) =>
            activeFilters.every(([columnId, value]) => {
              const accessor = filterAccessors.get(columnId);
              return accessor ? matchesFilter(accessor(row), value) : true;
            }),
          );

    if (!sort) return filteredRows;

    const column = columns.find((item) => item.id === sort.columnId);
    const accessor = column?.sortAccessor;
    if (!accessor) return filteredRows;

    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => compareValues(accessor(a), accessor(b)) * factor);
  }, [rows, columns, filters, filterableColumns, sort]);

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

  const resolveColumnWidth = useCallback(
    (column: DataGridColumn<T>) =>
      columnWidths[column.id] ??
      measuredColumnWidths[column.id] ??
      (typeof column.width === 'number' ? column.width : 0),
    [columnWidths, measuredColumnWidths],
  );

  const pinnedOffsets = useMemo<PinnedOffsets>(() => {
    const offsets: PinnedOffsets = {};
    const leftPinned = displayColumns.filter((column) => column.pin === 'left');
    const rightPinned = displayColumns.filter((column) => column.pin === 'right');
    const selectionWidth =
      selectionMode === 'multiple'
        ? (measuredColumnWidths[SELECTION_COLUMN_ID] ?? 44)
        : 0;

    let left = selectionWidth;
    leftPinned.forEach((column, index) => {
      offsets[column.id] = {
        side: 'left',
        value: left,
        edge: index === leftPinned.length - 1,
      };
      left += resolveColumnWidth(column);
    });

    let right = 0;
    for (let index = rightPinned.length - 1; index >= 0; index -= 1) {
      const column = rightPinned[index];
      if (!column) continue;

      offsets[column.id] = {
        side: 'right',
        value: right,
        edge: index === 0,
      };
      right += resolveColumnWidth(column);
    }

    return offsets;
  }, [displayColumns, measuredColumnWidths, resolveColumnWidth, selectionMode]);

  const moveColumnTo = useCallback(
    (sourceId: string, targetId: string) => {
      const source = displayColumns.find((column) => column.id === sourceId);
      const target = displayColumns.find((column) => column.id === targetId);
      if (!source || !target || source.pin !== target.pin) return;

      const ids = displayColumns.map((column) => column.id);
      const nextOrder = moveItem(ids, ids.indexOf(sourceId), ids.indexOf(targetId));
      if (controlledColumnOrder === undefined) {
        setInternalColumnOrder(nextOrder);
      }
      onColumnOrderChange?.(nextOrder);
    },
    [controlledColumnOrder, displayColumns, onColumnOrderChange],
  );

  const moveColumnBy = useCallback(
    (columnId: string, offset: number) => {
      const from = displayColumns.findIndex((column) => column.id === columnId);
      const target = displayColumns[from + offset];
      const source = displayColumns[from];
      if (from < 0 || !source || !target || source.pin !== target.pin) return;

      const ids = displayColumns.map((column) => column.id);
      const nextOrder = moveItem(ids, from, from + offset);
      if (controlledColumnOrder === undefined) {
        setInternalColumnOrder(nextOrder);
      }
      onColumnOrderChange?.(nextOrder);
    },
    [controlledColumnOrder, displayColumns, onColumnOrderChange],
  );

  const toggleColumnPin = useCallback(
    (columnId: string) => {
      const column = columns.find((item) => item.id === columnId);
      if (!column) return;

      const currentPin = columnId in pinOverrides ? pinOverrides[columnId] : column.pin;
      const nextPins: ColumnPins = { ...pinOverrides, [columnId]: currentPin ? null : 'left' };
      if (controlledColumnPins === undefined) {
        setInternalColumnPins(nextPins);
      }
      onColumnPinsChange?.(nextPins);
    },
    [columns, controlledColumnPins, onColumnPinsChange, pinOverrides],
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

    const nextSort: SortState | null =
      sort?.columnId !== column.id
        ? { columnId: column.id, direction: 'asc' }
        : sort.direction === 'asc'
          ? { columnId: column.id, direction: 'desc' }
          : null;

    if (controlledSort === undefined) {
      setInternalSort(nextSort);
    }
    onSortChange?.(nextSort);
  };

  const updateFilter = useCallback(
    (columnId: string, value: string) => {
      if ((filters[columnId] ?? '') === value) return;

      const nextFilters = { ...filters };
      if (value === '') {
        delete nextFilters[columnId];
      } else {
        nextFilters[columnId] = value;
      }

      if (controlledFilters === undefined) {
        setInternalFilters(nextFilters);
      }
      onFiltersChange?.(nextFilters);
    },
    [controlledFilters, filters, onFiltersChange],
  );

  const rootClassName = ['pdg', striped && 'pdg--striped', onRowClick && 'pdg--clickable', className]
    .filter(Boolean)
    .join(' ');
  const tableClassName = ['pdg__table', resizableColumns && 'pdg__table--resizable']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <div className="pdg__frame">
        {caption ? (
          <div id={captionId} className="pdg__caption">
            {caption}
          </div>
        ) : null}
        <div className="pdg__scroll">
          <table
            ref={tableRef}
            className={tableClassName}
            aria-labelledby={caption ? captionId : undefined}
          >
            <colgroup>
              {selectionMode === 'multiple' ? <col className="pdg__col-select" /> : null}
              {displayColumns.map((column) => {
                const width = columnWidths[column.id] ?? column.width;
                return <col key={column.id} style={width === undefined ? undefined : { width }} />;
              })}
            </colgroup>
            <DataGridHeader
              columns={displayColumns}
              sort={sort}
              selectionMode={selectionMode}
              allSelected={allSelected}
              someSelected={someSelected}
              resizableColumns={resizableColumns}
              reorderableColumns={reorderableColumns}
              filterableColumns={filterableColumns}
              filters={filters}
              minColumnWidth={minColumnWidth}
              draggedColumnId={draggedColumnId}
              dragOverColumnId={dragOverColumnId}
              pinnedOffsets={pinnedOffsets}
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
              onTogglePin={toggleColumnPin}
              onFilterChange={updateFilter}
            />
            <DataGridBody
              rows={sortedRows}
              columns={displayColumns}
              getRowId={getRowId}
              emptyMessage={emptyMessage}
              selectionMode={selectionMode}
              isRowSelected={isRowSelected}
              columnOffsets={pinnedOffsets}
              onToggleSelect={toggleRow}
              onRowClick={onRowClick}
            />
          </table>
        </div>
      </div>
    </div>
  );
}
