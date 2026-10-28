import { SelectionCheckbox } from '../shared/SelectionCheckbox';
import type { DataGridColumn, PinnedOffsets, SelectionMode } from '../types';

interface DataGridRowProps<T> {
  row: T;
  rowIndex: number;
  columns: ReadonlyArray<DataGridColumn<T>>;
  selected: boolean;
  selectionMode: SelectionMode;
  columnOffsets: PinnedOffsets;
  onToggleSelect: (row: T, index: number) => void;
  onRowClick?: (row: T, index: number) => void;
}

export function DataGridRow<T>({
  row,
  rowIndex,
  columns,
  selected,
  selectionMode,
  columnOffsets,
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
        <td
          className="pdg__cell pdg__select-cell pdg__cell--pinned pdg__cell--pinned-left"
          style={{ left: 0 }}
        >
          <SelectionCheckbox
            checked={selected}
            label={`Select row ${rowIndex + 1}`}
            onChange={() => onToggleSelect(row, rowIndex)}
          />
        </td>
      ) : null}
      {columns.map((column) => {
        const pinOffset = columnOffsets[column.id];
        const cellClassName = [
          'pdg__cell',
          column.pin && 'pdg__cell--pinned',
          column.pin && `pdg__cell--pinned-${column.pin}`,
          column.pin && pinOffset?.edge && `pdg__cell--pinned-${column.pin}-edge`,
        ]
          .filter(Boolean)
          .join(' ');
        const pinStyle = pinOffset
          ? pinOffset.side === 'left'
            ? { left: pinOffset.value }
            : { right: pinOffset.value }
          : undefined;

        return (
          <td
            key={column.id}
            className={cellClassName}
            style={{ textAlign: column.align, ...pinStyle }}
          >
            {column.accessor(row)}
          </td>
        );
      })}
    </tr>
  );
}
