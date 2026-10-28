import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SelectionMode = 'none' | 'single' | 'multiple';
export type RowId = string | number;

export interface DataGridColumn<T> {
  id: string;
  header: ReactNode;
  accessor: (row: T) => ReactNode;
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  resizable?: boolean;
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
}

export interface SortState {
  columnId: string;
  direction: SortDirection;
}
