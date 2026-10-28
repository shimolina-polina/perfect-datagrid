import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataGrid } from './DataGrid';
import type { DataGridColumn } from './types';

interface Row {
  id: number;
  name: string;
  score: number;
}

const rows: Row[] = [
  { id: 1, name: 'Beta', score: 20 },
  { id: 2, name: 'Alpha', score: 30 },
  { id: 3, name: 'Gamma', score: 10 },
];

const columns: DataGridColumn<Row>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortAccessor: (row) => row.name },
  { id: 'score', header: 'Score', accessor: (row) => row.score, sortAccessor: (row) => row.score },
];

function bodyValues(columnIndex: number) {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[columnIndex]?.textContent);
}

function rowCells(rowIndex: number) {
  return within(screen.getAllByRole('row')[rowIndex + 1]).getAllByRole('cell').map((cell) => cell.textContent);
}

describe('DataGrid', () => {
  it('renders headers and rows', () => {
    render(<DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /score/i })).toBeInTheDocument();
    expect(bodyValues(0)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('sorts rows ascending and descending on repeated header clicks', () => {
    render(<DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />);

    const scoreButton = screen.getByRole('button', { name: /score/i });

    fireEvent.click(scoreButton);
    expect(bodyValues(1)).toEqual(['10', '20', '30']);

    fireEvent.click(scoreButton);
    expect(bodyValues(1)).toEqual(['30', '20', '10']);

    fireEvent.click(scoreButton);
    expect(bodyValues(1)).toEqual(['20', '30', '10']);
  });

  it('calls onRowClick with the row data', () => {
    const onRowClick = vi.fn();
    render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} onRowClick={onRowClick} />,
    );

    fireEvent.click(screen.getByText('Alpha'));

    expect(onRowClick).toHaveBeenCalledWith(rows[1], 1);
  });

  it('highlights selected rows', () => {
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        isRowSelected={(row) => row.id === 2}
      />,
    );

    expect(screen.getByText('Alpha').closest('tr')).toHaveClass('pdg__row--selected');
    expect(screen.getByText('Beta').closest('tr')).not.toHaveClass('pdg__row--selected');
  });

  it('supports multiple row selection', () => {
    const onSelectionChange = vi.fn();
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByText('Beta'));
    expect(screen.getByText('Beta').closest('tr')).toHaveClass('pdg__row--selected');

    fireEvent.click(screen.getByText('Alpha'));
    expect(screen.getByText('Beta').closest('tr')).toHaveClass('pdg__row--selected');
    expect(screen.getByText('Alpha').closest('tr')).toHaveClass('pdg__row--selected');
    expect(onSelectionChange).toHaveBeenLastCalledWith([1, 2], [rows[0], rows[1]]);

    fireEvent.click(screen.getByText('Beta'));
    expect(screen.getByText('Beta').closest('tr')).not.toHaveClass('pdg__row--selected');
    expect(onSelectionChange).toHaveBeenLastCalledWith([2], [rows[1]]);
  });

  it('selects and clears all rows from the header checkbox', () => {
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectionMode="multiple"
      />,
    );

    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });

    fireEvent.click(selectAll);
    rows.forEach((row) => {
      expect(screen.getByText(row.name).closest('tr')).toHaveClass('pdg__row--selected');
    });

    fireEvent.click(selectAll);
    rows.forEach((row) => {
      expect(screen.getByText(row.name).closest('tr')).not.toHaveClass('pdg__row--selected');
    });
  });

  it('renders column resize handles only when enabled', () => {
    const { rerender } = render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />,
    );

    expect(screen.queryAllByRole('separator')).toHaveLength(0);

    rerender(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} resizableColumns />,
    );

    expect(screen.getAllByRole('separator')).toHaveLength(columns.length);
  });

  it('resizes a column with the keyboard', () => {
    const { container } = render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} resizableColumns />,
    );

    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize name column' }), {
      key: 'ArrowRight',
    });

    expect(container.querySelector('col')?.style.width).toBe('80px');
  });

  it('renders column drag handles only when reordering is enabled', () => {
    const { rerender } = render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />,
    );

    expect(screen.queryAllByRole('button', { name: /reorder/i })).toHaveLength(0);

    rerender(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} reorderableColumns />,
    );

    expect(screen.getAllByRole('button', { name: /reorder/i })).toHaveLength(columns.length);
  });

  it('reorders columns with the keyboard', () => {
    render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} reorderableColumns />,
    );

    expect(rowCells(0)).toEqual(['Beta', '20']);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder name column' }), {
      key: 'ArrowRight',
    });
    expect(rowCells(0)).toEqual(['20', 'Beta']);

    fireEvent.keyDown(screen.getByRole('button', { name: 'Reorder name column' }), {
      key: 'ArrowLeft',
    });
    expect(rowCells(0)).toEqual(['Beta', '20']);
  });

  it('reorders columns by dragging a header onto another', () => {
    render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} reorderableColumns />,
    );

    const dataTransfer = {
      effectAllowed: 'none',
      dropEffect: 'none',
      setData: vi.fn(),
      getData: vi.fn(),
    };
    const dragHandle = screen.getByRole('button', { name: 'Reorder name column' });
    const scoreHeader = screen.getAllByRole('columnheader')[1];

    fireEvent.dragStart(dragHandle, { dataTransfer });
    fireEvent.dragOver(scoreHeader, { dataTransfer });
    fireEvent.drop(scoreHeader, { dataTransfer });

    expect(rowCells(0)).toEqual(['20', 'Beta']);
  });

  it('renders the empty message when there are no rows', () => {
    render(<DataGrid rows={[]} columns={columns} emptyMessage="Nothing here" />);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
