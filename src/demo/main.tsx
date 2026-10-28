import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataGrid, type DataGridColumn } from '../index';
import './demo.css';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  salary: number;
}

const employees: Employee[] = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', department: 'Platform', salary: 145000 },
  { id: 2, name: 'Grace Hopper', role: 'Staff Engineer', department: 'Compiler', salary: 172000 },
  { id: 3, name: 'Alan Turing', role: 'Researcher', department: 'AI', salary: 168000 },
  { id: 4, name: 'Katherine Johnson', role: 'Analyst', department: 'Aerospace', salary: 132000 },
  { id: 5, name: 'Linus Torvalds', role: 'Maintainer', department: 'Kernel', salary: 158000 },
];

const columns: DataGridColumn<Employee>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: (row) => row.name,
    sortAccessor: (row) => row.name,
    width: 220,
    pin: 'left',
  },
  {
    id: 'role',
    header: 'Role',
    accessor: (row) => row.role,
    sortAccessor: (row) => row.role,
    width: 200,
  },
  {
    id: 'department',
    header: 'Department',
    accessor: (row) => row.department,
    sortAccessor: (row) => row.department,
    width: 220,
  },
  {
    id: 'salary',
    header: 'Salary',
    accessor: (row) => `$${row.salary.toLocaleString('en-US')}`,
    sortAccessor: (row) => row.salary,
    align: 'right',
    width: 160,
    pin: 'right',
  },
];

function App() {
  const [selectedRows, setSelectedRows] = useState<Employee[]>([]);

  return (
    <main className="demo">
      <header className="demo__header">
        <p className="demo__eyebrow">perfect-datagrid</p>
        <h1 className="demo__title">A lightweight React data grid</h1>
        <p className="demo__subtitle">
          Sortable, resizable, reorderable and pinnable columns, multiple selection and zero
          runtime dependencies beyond React.
        </p>
      </header>

      <DataGrid
        rows={employees}
        columns={columns}
        getRowId={(row) => row.id}
        caption="Engineering team"
        striped
        resizableColumns
        reorderableColumns
        selectionMode="multiple"
        onSelectionChange={(_ids, selectedRows) => setSelectedRows(selectedRows)}
      />

      <p className="demo__selection">
        {selectedRows.length === 0
          ? 'Select one or more rows.'
          : `Selected (${selectedRows.length}): ${selectedRows
              .map((row) => row.name)
              .join(', ')}`}
      </p>
    </main>
  );
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
