# perfect-datagrid

A lightweight, accessible data grid component for React. Sorting, filtering, column resizing, reordering and pinning, with row selection — and no runtime dependencies beyond React.

## Install

```bash
npm install perfect-datagrid
```

React and React DOM `>= 18` are peer dependencies.

## Usage

```tsx
import { DataGrid, type DataGridColumn } from 'perfect-datagrid';
import 'perfect-datagrid/style.css';

interface Employee {
  id: number;
  name: string;
  salary: number;
}

const columns: DataGridColumn<Employee>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortAccessor: (row) => row.name },
  { id: 'salary', header: 'Salary', accessor: (row) => row.salary, align: 'right' },
];

export function Employees({ rows }: { rows: Employee[] }) {
  return <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} striped />;
}
```

The stylesheet is not injected automatically — import `perfect-datagrid/style.css` once in your application.

## Features

- **Sorting** — three states: `asc → desc → none`, driven by `column.sortAccessor`.
- **Filtering** — a filter row under the header. Text filters match case-insensitive substrings; select filters show multi-select options collected from the data. Multiple filters are combined with AND.
- **Column resizing** — drag the handle on the header edge; `table-layout` switches to fixed while resizing.
- **Column reordering** — drag and drop or use the arrow keys on the column drag handle.
- **Column pinning** — stick columns to the left or right edge with computed offsets.
- **Row selection** — `none`, `single` or `multiple`, controlled or uncontrolled.
- **Scrolling** — the grid stays inside its container, scrolls in both directions and keeps the header row visible.
- **Accessibility** — semantic table markup, labelled controls, keyboard-operable headers.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `readonly T[]` | — | Row data. |
| `columns` | `ReadonlyArray<DataGridColumn<T>>` | — | Column configuration. |
| `getRowId` | `(row, index) => string \| number` | row index | Stable row identity. Required for selection to survive sorting and filtering. |
| `emptyMessage` | `ReactNode` | `'No data'` | Content rendered when there are no rows. |
| `caption` | `ReactNode` | — | Table caption. |
| `className` | `string` | — | Extra class name for the root element. |
| `striped` | `boolean` | `false` | Alternating row background. |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | Selection behaviour. |
| `selectedRowIds` | `ReadonlyArray<string \| number>` | — | Controlled selection. |
| `defaultSelectedRowIds` | `ReadonlyArray<string \| number>` | `[]` | Initial selection for uncontrolled mode. |
| `onSelectionChange` | `(ids, rows) => void` | — | Called with selected ids and row objects. |
| `isRowSelected` | `(row, index) => boolean` | — | External highlight on top of the built-in selection. |
| `onRowClick` | `(row, index) => void` | — | Row click handler. |
| `resizableColumns` | `boolean` | `false` | Enable column resizing. |
| `minColumnWidth` | `number` | `80` | Minimum width in pixels when resizing. |
| `reorderableColumns` | `boolean` | `false` | Enable column reordering. |
| `filterableColumns` | `boolean` | `false` | Show the filter row. |
| `maxHeight` | `number \| string` | — | Maximum height of the scroll area; the header stays visible while scrolling. |
| `sort` | `SortState \| null` | — | Controlled sorting. |
| `defaultSort` | `SortState \| null` | `null` | Initial sorting for uncontrolled mode. |
| `onSortChange` | `(sort) => void` | — | Called when sorting changes. |
| `filters` | `Readonly<Record<string, string>>` | — | Controlled filters. |
| `defaultFilters` | `Readonly<Record<string, string>>` | `{}` | Initial filters for uncontrolled mode. |
| `onFiltersChange` | `(filters) => void` | — | Called when filters change. |
| `columnOrder` | `ReadonlyArray<string>` | — | Controlled column order by id. |
| `defaultColumnOrder` | `ReadonlyArray<string>` | column order | Initial order for uncontrolled mode. |
| `onColumnOrderChange` | `(order) => void` | — | Called when the order changes. |
| `columnPins` | `Readonly<Record<string, 'left' \| 'right' \| null>>` | — | Controlled pin overrides. |
| `defaultColumnPins` | `Readonly<Record<string, 'left' \| 'right' \| null>>` | `{}` | Initial pin overrides. |
| `onColumnPinsChange` | `(pins) => void` | — | Called when pins change. |

Every setting supports both controlled and uncontrolled usage with the same `value` / `defaultValue` / `onValueChange` pattern. When the controlled prop is omitted, state is kept inside `DataGrid` and the callback still fires.

## Columns

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique column id. Used by sorting, filters, order and pins. |
| `header` | `ReactNode` | Header content. |
| `accessor` | `(row) => ReactNode` | Cell content. |
| `sortAccessor` | `(row) => string \| number \| Date \| null \| undefined` | Sortable value. Enables sorting when present. |
| `filterAccessor` | `(row) => string \| number \| Date \| null \| undefined` | Filterable value. Falls back to `sortAccessor`, then to a primitive `accessor` result. |
| `filterable` | `boolean` | Set to `false` to skip the column in filtering. |
| `filterType` | `'text' \| 'select'` | Filter control. `'select'` renders a multi-select dropdown whose options are collected from the data. Defaults to `'text'`. |
| `width` | `number \| string` | Column width, also used as a fallback for pin offsets. |
| `align` | `'left' \| 'center' \| 'right'` | Cell alignment. |
| `resizable` | `boolean` | Set to `false` to disable resizing for the column. |
| `pin` | `'left' \| 'right'` | Pin the column to an edge. |

Reordering is only allowed within a group of columns that share the same `pin`.

## Filtering

`filterableColumns` adds a filter row under the header. Each column filters on `filterAccessor`, falling back to `sortAccessor` and then to `accessor` when it returns a primitive value.

```tsx
const columns: DataGridColumn<Employee>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name },
  { id: 'department', header: 'Department', accessor: (row) => row.department, filterType: 'select' },
];
```

- A `filterType: 'select'` column renders a dropdown with a checkbox per unique value taken from the rows; empty strings are offered as `(empty)`. Values within one column are combined with OR, different columns with AND.
- `filters` values are `string` for text columns and `readonly string[]` for select columns: `{ department: ['Platform', 'Kernel'], name: 'ada' }`.
- Filters work without passing `filters`; the grid keeps them internally and only calls `onFiltersChange`. Pass `filters` together with `onFiltersChange` to control them from outside.

## Scrolling and layout

The grid never grows past its container. Set `maxHeight` to make the body scroll while the header row, including the filter row, stays pinned at the top. Cell content wraps onto multiple lines instead of being clipped.

## Controlled settings example

```tsx
const [sort, setSort] = useState<SortState | null>({ columnId: 'salary', direction: 'desc' });
const [filters, setFilters] = useState<ColumnFilters>({ department: ['Platform', 'Kernel'] });
const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
const [columnPins, setColumnPins] = useState<ColumnPins>({ status: 'left' });

<DataGrid
  rows={rows}
  columns={columns}
  sort={sort}
  onSortChange={setSort}
  filters={filters}
  onFiltersChange={setFilters}
  columnOrder={columnOrder}
  onColumnOrderChange={setColumnOrder}
  columnPins={columnPins}
  onColumnPinsChange={setColumnPins}
  filterableColumns
  reorderableColumns
/>;
```

`columnPins` entries are overrides on top of `column.pin`: `'left'` / `'right'` pin the column, `null` unpins it even when the column config sets `pin`, and a missing key falls back to `column.pin`.

## Styling

All styles live in `perfect-datagrid/style.css`. Class names are prefixed with `pdg` and colours use `--pdg-*` CSS variables, so themes can be adjusted without overriding structure.

## Development

```bash
npm install
npm run dev          # demo playground
npm run typecheck
npm run lint
npm test
npm run build
```

## License

MIT
