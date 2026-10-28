import { SelectionCheckbox } from './SelectionCheckbox';
import type { DataGridColumn, SelectionMode } from './types';

interface DataGridRowProps<T> {
  row: T;
  rowIndex: number;
  columns: ReadonlyArray<DataGridColumn<T>>;
  selected: boolean;
  selectionMode: SelectionMode;
  onToggleSelect: (row: T, index: number) => void;
  onRowClick?: (row: T, index: number) => void;
}

export function DataGridRow<T>({
  row,
  rowIndex,
  columns,
  selected,
  selectionMode,
  onToggleSelect,
  onRowClick,
}: DataGridRowProps<T>) {
  const selectable = selectionMode !== 'none';
  const canActivate = selectable || Boolean(onRowClick);

  const activate = () => {
    if (selectable) {
      onToggleSelect(row, rowIndex);
    }
    onRowClick?.(row, rowIndex);
  };

  const rowClassName = ['pdg__row', selected && 'pdg__row--selected'].filter(Boolean).join(' ');

  return (
    <tr
      className={rowClassName}
      tabIndex={canActivate ? 0 : undefined}
      onClick={canActivate ? activate : undefined}
      onKeyDown={
        canActivate
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                activate();
              }
            }
          : undefined
      }
    >
      {selectionMode === 'multiple' ? (
        <td className="pdg__cell pdg__select-cell">
          <SelectionCheckbox
            checked={selected}
            label={`Select row ${rowIndex + 1}`}
            onChange={() => onToggleSelect(row, rowIndex)}
          />
        </td>
      ) : null}
      {columns.map((column) => (
        <td key={column.id} className="pdg__cell" style={{ textAlign: column.align }}>
          {column.accessor(row)}
        </td>
      ))}
    </tr>
  );
}
