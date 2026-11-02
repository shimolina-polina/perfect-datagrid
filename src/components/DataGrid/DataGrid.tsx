import { useCallback, useId, useMemo, useState } from 'react';
import { DataGridBody } from './body/DataGridBody';
import { DataGridFooter } from './footer/DataGridFooter';
import { DataGridHeader } from './header/DataGridHeader';
import type {
  ColumnFilters,
  ColumnFilterValue,
  ColumnPin,
  ColumnPins,
  DataGridColumn,
  DataGridProps,
  PaginationModel,
  PinnedOffsets,
  RowId,
  SortState,
} from './types';
import { useMeasuredColumnWidths } from './hooks/useMeasuredColumnWidths';
import { useStickyHeaderOffset } from './hooks/useStickyHeaderOffset';
import {
  collectFilterOptions,
  compareValues,
  isEmptyFilterValue,
  isSameFilterValue,
  matchesFilter,
  matchesFilterValues,
  moveItem,
  normalizeFilterValues,
  SELECTION_COLUMN_ID,
  toFilterText,
} from './lib/utils';
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
  maxHeight,
  paginationModel: controlledPaginationModel,
  defaultPaginationModel,
  onPaginationModelChange,
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
  const [internalFilters, setInternalFilters] = useState<ColumnFilters>(() => ({
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
  const [internalPaginationModel, setInternalPaginationModel] = useState<PaginationModel | null>(
    () => (defaultPaginationModel ? { ...defaultPaginationModel } : null),
  );
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
  const filterRowOffset = useStickyHeaderOffset(tableRef);

  const isControlled = selectedRowIds !== undefined;
  const selectedIds = isControlled ? selectedRowIds : internalSelectedIds;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const resolveRowId = useCallback(
    (row: T, index: number): RowId => (getRowId ? getRowId(row, index) : index),
    [getRowId],
  );

  const filterAccessors = useMemo(() => {
    const accessors = new Map<string, (row: T) => unknown>();

    columns.forEach((column) => {
      if (column.filterable === false) return;

      const accessor = column.filterAccessor ?? column.sortAccessor;
      if (accessor) {
        accessors.set(column.id, accessor);
        return;
      }

      if (rows.some((row) => toFilterText(column.accessor(row)) !== null)) {
        accessors.set(column.id, column.accessor);
      }
    });

    return accessors;
  }, [columns, rows]);

  const filterableColumnIds = useMemo(
    () => new Set(filterAccessors.keys()),
    [filterAccessors],
  );

  const selectFilterColumnIds = useMemo(
    () =>
      new Set(
        columns.filter((column) => column.filterType === 'select').map((column) => column.id),
      ),
    [columns],
  );

  const filterOptions = useMemo(() => {
    const options: Record<string, readonly string[]> = {};

    columns.forEach((column) => {
      if (column.filterType !== 'select') return;

      const accessor = filterAccessors.get(column.id);
      if (!accessor) return;

      options[column.id] = collectFilterOptions(rows, accessor);
    });

    return options;
  }, [columns, filterAccessors, rows]);

  const sortedRows = useMemo(() => {
    const activeFilters = filterableColumns
      ? Object.entries(filters).filter(
          ([columnId, value]) => filterAccessors.has(columnId) && !isEmptyFilterValue(value),
        )
      : [];

    const filteredRows =
      activeFilters.length === 0
        ? rows
        : rows.filter((row) =>
            activeFilters.every(([columnId, value]) => {
              const accessor = filterAccessors.get(columnId);
              if (!accessor) return true;

              if (selectFilterColumnIds.has(columnId)) {
                return matchesFilterValues(accessor(row), normalizeFilterValues(value));
              }

              return matchesFilter(
                accessor(row),
                typeof value === 'string' ? value : (value[0] ?? ''),
              );
            }),
          );

    if (!sort) return filteredRows;

    const column = columns.find((item) => item.id === sort.columnId);
    const accessor = column?.sortAccessor;
    if (!accessor) return filteredRows;

    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => compareValues(accessor(a), accessor(b)) * factor);
  }, [
    rows,
    columns,
    filters,
    filterableColumns,
    filterAccessors,
    selectFilterColumnIds,
    sort,
  ]);

  const activePaginationModel = controlledPaginationModel ?? internalPaginationModel;
  const paginationEnabled = activePaginationModel !== null;
  const pageSize = activePaginationModel
    ? Math.max(1, Math.floor(activePaginationModel.pageSize))
    : 1;
  const pageCount = paginationEnabled
    ? Math.max(1, Math.ceil(sortedRows.length / pageSize))
    : 1;
  const page = activePaginationModel
    ? Math.min(Math.max(0, Math.floor(activePaginationModel.page)), pageCount - 1)
    : 0;
  const pageStart = page * pageSize;
  const visibleRows = paginationEnabled
    ? sortedRows.slice(pageStart, pageStart + pageSize)
    : sortedRows;

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

  const pageRowIds = visibleRows.map((row, index) => resolveRowId(row, pageStart + index));
  const allSelected = pageRowIds.length > 0 && pageRowIds.every((id) => selectedIdSet.has(id));
  const someSelected = !allSelected && pageRowIds.some((id) => selectedIdSet.has(id));

  const toggleAll = () => {
    if (selectionMode !== 'multiple') return;

    const pageIdSet = new Set(pageRowIds);
    updateSelection(
      allSelected
        ? selectedIds.filter((id) => !pageIdSet.has(id))
        : [...new Set([...selectedIds, ...pageRowIds])],
    );
  };

  const updatePagination = useCallback(
    (nextPage: number) => {
      const nextModel: PaginationModel = {
        page: Math.max(0, Math.floor(nextPage)),
        pageSize,
      };

      if (controlledPaginationModel === undefined) {
        setInternalPaginationModel(nextModel);
      }
      onPaginationModelChange?.(nextModel);
    },
    [controlledPaginationModel, onPaginationModelChange, pageSize],
  );

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
    (columnId: string, value: ColumnFilterValue) => {
      if (isSameFilterValue(filters[columnId], value)) return;

      const nextFilters: ColumnFilters = { ...filters };
      if (isEmptyFilterValue(value)) {
        delete nextFilters[columnId];
      } else {
        nextFilters[columnId] = typeof value === 'string' ? value : [...value];
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
        <div className="pdg__scroll" style={maxHeight === undefined ? undefined : { maxHeight }}>
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
              filterableColumnIds={filterableColumnIds}
              filterOptions={filterOptions}
              filters={filters}
              filterRowOffset={filterRowOffset}
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
              rows={visibleRows}
              columns={displayColumns}
              getRowId={getRowId}
              emptyMessage={emptyMessage}
              selectionMode={selectionMode}
              isRowSelected={isRowSelected}
              columnOffsets={pinnedOffsets}
              rowIndexOffset={pageStart}
              onToggleSelect={toggleRow}
              onRowClick={onRowClick}
            />
          </table>
        </div>
        {paginationEnabled ? (
          <DataGridFooter
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            totalRows={sortedRows.length}
            onPageChange={updatePagination}
          />
        ) : null}
      </div>
    </div>
  );
}
