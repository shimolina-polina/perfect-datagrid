import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SelectionMode = 'none' | 'single' | 'multiple';
export type RowId = string | number;
export type ColumnPin = 'left' | 'right';
export type ColumnFilterType = 'text' | 'select';
export type ColumnFilterValue = string | readonly string[];
export type ColumnFilters = Record<string, ColumnFilterValue>;
export type ColumnPins = Record<string, ColumnPin | null>;

export interface DataGridColumn<T> {
  id: string;
  header: ReactNode;
  accessor: (row: T) => ReactNode;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  filterAccessor?: (row: T) => string | number | Date | null | undefined;
  filterable?: boolean;
  filterType?: ColumnFilterType;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  resizable?: boolean;
  pin?: ColumnPin;
}

export interface DataGridProps<T> {
  rows: readonly T[];
  columns: ReadonlyArray<DataGridColumn<T>>;
  getRowId?: (row: T, index: number) => RowId;
  emptyMessage?: ReactNode;
  caption?: ReactNode;
  className?: string;
  striped?: boolean;
  selectionMode?: SelectionMode;
  selectedRowIds?: ReadonlyArray<RowId>;
  defaultSelectedRowIds?: ReadonlyArray<RowId>;
  onSelectionChange?: (selectedRowIds: RowId[], selectedRows: T[]) => void;
  isRowSelected?: (row: T, index: number) => boolean;
  onRowClick?: (row: T, index: number) => void;
  resizableColumns?: boolean;
  minColumnWidth?: number;
  reorderableColumns?: boolean;
  filterableColumns?: boolean;
  maxHeight?: number | string;
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  filters?: Readonly<ColumnFilters>;
  defaultFilters?: Readonly<ColumnFilters>;
  onFiltersChange?: (filters: ColumnFilters) => void;
  columnOrder?: ReadonlyArray<string>;
  defaultColumnOrder?: ReadonlyArray<string>;
  onColumnOrderChange?: (columnOrder: string[]) => void;
  columnPins?: Readonly<ColumnPins>;
  defaultColumnPins?: Readonly<ColumnPins>;
  onColumnPinsChange?: (columnPins: ColumnPins) => void;
}

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

export interface PinnedOffset {
  side: ColumnPin;
  value: number;
  edge: boolean;
}

export type PinnedOffsets = Record<string, PinnedOffset>;

