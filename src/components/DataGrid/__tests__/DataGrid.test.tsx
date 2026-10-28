import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../DataGrid';
import type { DataGridColumn } from '../types';

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

function dataValues(columnIndex: number) {
  const body = screen.getAllByRole('rowgroup')[1];

  return within(body)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[columnIndex]?.textContent);
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

    const scoreButton = screen.getByRole('button', { name: 'Score' });

    fireEvent.click(scoreButton);
    expect(bodyValues(1)).toEqual(['10', '20', '30']);

    fireEvent.click(scoreButton);
    expect(bodyValues(1)).toEqual(['30', '20', '10']);

    fireEvent.click(scoreButton);
    expect(bodyValues(1)).toEqual(['20', '30', '10']);
  });

  it('renders column filters only when enabled', () => {
    const { rerender } = render(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />,
    );

    expect(screen.queryByRole('searchbox', { name: 'Filter name column' })).not.toBeInTheDocument();

    rerender(
      <DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} filterableColumns />,
    );

    expect(screen.getByRole('searchbox', { name: 'Filter name column' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filter score column' })).toBeInTheDocument();
  });

  it('filters rows by column values and combines filters', () => {
    render(<DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} filterableColumns />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter name column' }), {
      target: { value: 'M' },
    });
    expect(dataValues(0)).toEqual(['Gamma']);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter score column' }), {
      target: { value: '1' },
    });
    expect(dataValues(1)).toEqual(['10']);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter name column' }), {
      target: { value: 'alp' },
    });
    expect(dataValues(0)).toEqual(['No data']);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('clears a filter and restores the rows', () => {
    render(<DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} filterableColumns />);

    const nameFilter = screen.getByRole('searchbox', { name: 'Filter name column' });

    fireEvent.change(nameFilter, { target: { value: 'alp' } });
    expect(dataValues(0)).toEqual(['Alpha']);

    fireEvent.change(nameFilter, { target: { value: '' } });
    expect(dataValues(0)).toEqual(['Beta', 'Alpha', 'Gamma']);
  });

  it('uses filterAccessor and respects filterable: false', () => {
    const filterColumns: DataGridColumn<Row>[] = [
      {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        filterAccessor: (row) => row.name,
        filterable: false,
      },
      {
        id: 'score',
        header: 'Score',
        accessor: (row) => row.score,
        filterAccessor: (row) => `#${row.score}`,
      },
    ];

    render(
      <DataGrid rows={rows} columns={filterColumns} getRowId={(row) => row.id} filterableColumns />,
    );

    expect(screen.queryByRole('searchbox', { name: 'Filter name column' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter score column' }), {
      target: { value: '#30' },
    });
    expect(dataValues(0)).toEqual(['Alpha']);
  });

  it('sorts filtered rows', () => {
    const filterRows: Row[] = [
      { id: 1, name: 'Delta', score: 40 },
      { id: 2, name: 'Echo', score: 20 },
      { id: 3, name: 'Bravo', score: 40 },
    ];

    render(
      <DataGrid
        rows={filterRows}
        columns={columns}
        getRowId={(row) => row.id}
        filterableColumns
      />,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Filter name column' }), {
      target: { value: 'a' },
    });
    expect(dataValues(0)).toEqual(['Delta', 'Bravo']);

    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(dataValues(0)).toEqual(['Bravo', 'Delta']);
  });

  it('selects only filtered rows from the header checkbox', () => {
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        filterableColumns
        selectionMode="multiple"
      />,
    );

    const nameFilter = screen.getByRole('searchbox', { name: 'Filter name column' });

    fireEvent.change(nameFilter, { target: { value: 'gamma' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    fireEvent.change(nameFilter, { target: { value: '' } });
    expect(screen.getByText('Gamma').closest('tr')).toHaveClass('pdg__row--selected');
    expect(screen.getByText('Beta').closest('tr')).not.toHaveClass('pdg__row--selected');
    expect(screen.getByText('Alpha').closest('tr')).not.toHaveClass('pdg__row--selected');
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

  it('keeps the caption outside the scrolling area', () => {
    render(
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Engineering team"
      />,
    );

    const caption = screen.getByText('Engineering team');
    expect(caption.closest('.pdg__scroll')).toBeNull();
    expect(screen.getByRole('table', { name: 'Engineering team' })).toBeInTheDocument();
  });

  it('groups pinned columns at the edges', () => {
    const pinnedColumns: DataGridColumn<Row>[] = [
      { ...columns[1], pin: 'right' },
      { ...columns[0], pin: 'left' },
    ];

    render(<DataGrid rows={rows} columns={pinnedColumns} getRowId={(row) => row.id} />);

    const headers = screen.getAllByRole('columnheader');
    expect(
      headers.map((header) => header.querySelector('.pdg__sort-button > span')?.textContent),
    ).toEqual(['Name', 'Score']);
    expect(headers[0]).toHaveClass('pdg__header--pinned-left');
    expect(headers[1]).toHaveClass('pdg__header--pinned-right');
    expect(screen.getByText('Beta').closest('td')).toHaveClass('pdg__cell--pinned-left');
    expect(screen.getByText('20').closest('td')).toHaveClass('pdg__cell--pinned-right');
  });

  it('offsets pinned columns by their widths', () => {
    const pinnedColumns: DataGridColumn<Row>[] = [
      { ...columns[0], pin: 'left', width: 120 },
      { ...columns[1], pin: 'left', width: 90 },
    ];

    render(<DataGrid rows={rows} columns={pinnedColumns} getRowId={(row) => row.id} />);

    expect(screen.getByRole('columnheader', { name: 'Score' }).style.left).toBe('120px');
    expect(screen.getByText('20').closest('td')?.style.left).toBe('120px');
  });

  it('offsets pinned columns after the selection column', () => {
    const pinnedColumns: DataGridColumn<Row>[] = [
      { ...columns[0], pin: 'left', width: 120 },
    ];

    render(
      <DataGrid
        rows={rows}
        columns={pinnedColumns}
        getRowId={(row) => row.id}
        selectionMode="multiple"
      />,
    );

    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });
    expect(selectAll.closest('th')).toHaveClass('pdg__header--pinned-left');
    expect(screen.getByRole('columnheader', { name: 'Name' }).style.left).toBe('44px');
  });

  it('pins and unpins a column from its menu', () => {
    render(<DataGrid rows={rows} columns={columns} getRowId={(row) => row.id} />);

    fireEvent.click(screen.getByRole('button', { name: 'Column menu for score' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Pin column' }));

    let headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('Score');
    expect(headers[0]).toHaveClass('pdg__header--pinned-left');
    expect(screen.getByText('20').closest('td')).toHaveClass('pdg__cell--pinned-left');

    fireEvent.click(screen.getByRole('button', { name: 'Column menu for score' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unpin column' }));

    headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('Name');
    expect(headers[0]).not.toHaveClass('pdg__header--pinned-left');
  });

  it('renders the empty message when there are no rows', () => {
    render(<DataGrid rows={[]} columns={columns} emptyMessage="Nothing here" />);

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
