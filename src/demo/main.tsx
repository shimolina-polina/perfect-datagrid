import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DataGrid,
  type ColumnFilters,
  type ColumnPins,
  type DataGridColumn,
  type SortState,
} from '../index';
import './demo.css';

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  location: string;
  level: string;
  email: string;
  phone: string;
  projects: number;
  startDate: string;
  manager: string;
  status: 'Active' | 'On leave' | 'Contract';
  salary: number;
  notes: string;
}

const firstNames = [
  'Ada',
  'Grace',
  'Alan',
  'Katherine',
  'Linus',
  'Margaret',
  'Dennis',
  'Barbara',
  'Tim',
  'Radia',
  'Ken',
  'Frances',
];
const lastNames = [
  'Lovelace',
  'Hopper',
  'Turing',
  'Johnson',
  'Torvalds',
  'Hamilton',
  'Ritchie',
  'Liskov',
  'Berners-Lee',
  'Perlman',
  'Thompson',
  'Allen',
];
const roles = [
  'Engineer',
  'Staff Engineer',
  'Researcher',
  'Analyst',
  'Maintainer',
  'Architect',
  'Engineering Manager',
  'Designer',
];
const departments = [
  'Platform',
  'Compiler',
  'AI',
  'Aerospace',
  'Kernel',
  'Web',
  'Infrastructure',
  'Developer Tools',
];
const locations = [
  'London',
  'New York',
  'San Francisco',
  'Berlin',
  'Tokyo',
  'Toronto',
  'Sydney',
  'Remote',
];
const levels = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
const statuses: Employee['status'][] = ['Active', 'Active', 'On leave', 'Contract'];
const notes = [
  'Leads the platform migration and reviews cross-team architecture proposals before every release.',
  'Maintains the compiler pipeline and coordinates release readiness with the infrastructure group.',
  'Owns the design system tokens and keeps the component library aligned with accessibility audits.',
  'Runs quarterly reliability reviews and documents incident follow-ups for the on-call rotation.',
  '',
];

const employees: Employee[] = Array.from({ length: 200 }, (_, index) => {
  const id = index + 1;
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  const managerFirst = firstNames[(index + 3) % firstNames.length];
  const managerLast = lastNames[(index + 5) % lastNames.length];
  const start = new Date(Date.UTC(2018 + (index % 8), index % 12, 1 + (index % 28)));

  return {
    id,
    name: `${firstName} ${lastName}`,
    role: roles[index % roles.length],
    department: departments[index % departments.length],
    location: locations[index % locations.length],
    level: levels[index % levels.length],
    email: `${firstName}.${lastName}${id}@example.com`.toLowerCase(),
    phone: `+1 (555) ${String(100 + (index % 900)).padStart(3, '0')}-${String(
      1000 + ((index * 7) % 9000),
    ).padStart(4, '0')}`,
    projects: 2 + (index % 18),
    startDate: start.toISOString().slice(0, 10),
    manager: `${managerFirst} ${managerLast}`,
    status: statuses[index % statuses.length],
    salary: 90000 + (index % 40) * 2500,
    notes: notes[index % notes.length],
  };
});

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
    filterType: 'select',
    width: 180,
  },
  {
    id: 'department',
    header: 'Department',
    accessor: (row) => row.department,
    sortAccessor: (row) => row.department,
    filterType: 'select',
    width: 180,
  },
  {
    id: 'location',
    header: 'Location',
    accessor: (row) => row.location,
    sortAccessor: (row) => row.location,
    filterType: 'select',
    width: 160,
  },
  {
    id: 'level',
    header: 'Level',
    accessor: (row) => row.level,
    sortAccessor: (row) => row.level,
    filterType: 'select',
    width: 110,
  },
  {
    id: 'email',
    header: 'Email',
    accessor: (row) => row.email,
    filterAccessor: (row) => row.email,
    width: 240,
  },
  {
    id: 'phone',
    header: 'Phone',
    accessor: (row) => row.phone,
    filterAccessor: (row) => row.phone,
    width: 170,
  },
  {
    id: 'projects',
    header: 'Projects',
    accessor: (row) => row.projects,
    sortAccessor: (row) => row.projects,
    width: 120,
    align: 'right',
  },
  {
    id: 'startDate',
    header: 'Start date',
    accessor: (row) => row.startDate,
    sortAccessor: (row) => row.startDate,
    width: 140,
  },
  {
    id: 'manager',
    header: 'Manager',
    accessor: (row) => row.manager,
    sortAccessor: (row) => row.manager,
    width: 180,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) => row.status,
    sortAccessor: (row) => row.status,
    filterType: 'select',
    width: 130,
  },
  {
    id: 'notes',
    header: 'Notes',
    accessor: (row) => row.notes,
    filterAccessor: (row) => row.notes,
    filterType: 'select',
    width: 280,
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

const defaultColumnOrder = columns.map((column) => column.id);

function App() {
  const [selectedRows, setSelectedRows] = useState<Employee[]>([]);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<ColumnFilters>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
  const [columnPins, setColumnPins] = useState<ColumnPins>({});

  const applyPreset = () => {
    setSort({ columnId: 'salary', direction: 'desc' });
    setFilters({ department: ['Platform'], status: ['Active', 'Contract'] });
    setColumnPins({ status: 'left' });
    setColumnOrder(['status', 'role', 'name', 'department']);
  };

  const resetSettings = () => {
    setSort(null);
    setFilters({});
    setColumnPins({});
    setColumnOrder(defaultColumnOrder);
  };

  return (
    <main className="demo">
      <header className="demo__header">
        <p className="demo__eyebrow">perfect-datagrid</p>
        <h1 className="demo__title">A lightweight React data grid</h1>
        <p className="demo__subtitle">
          200 rows and 13 columns with sortable, filterable, resizable, reorderable and pinnable
          headers, multiple selection and zero runtime dependencies beyond React.
        </p>
      </header>

      <div className="demo__toolbar">
        <button type="button" onClick={applyPreset}>
          Apply external settings
        </button>
        <button type="button" onClick={resetSettings}>
          Reset settings
        </button>
      </div>

      <p className="demo__settings">
        Sort: {sort ? `${sort.columnId} ${sort.direction}` : 'none'} · Filters:{' '}
        {Object.keys(filters).length} · Pins: {Object.keys(columnPins).length} · Order:{' '}
        {columnOrder.slice(0, 4).join(', ')}
        {columnOrder.length > 4 ? '…' : ''}
      </p>

      <div className="demo__grid">
        <DataGrid
          rows={employees}
          columns={columns}
          getRowId={(row) => row.id}
          caption="Engineering team"
          striped
          resizableColumns
          reorderableColumns
          filterableColumns
          selectionMode="multiple"
          sort={sort}
          onSortChange={setSort}
          filters={filters}
          onFiltersChange={setFilters}
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
          columnPins={columnPins}
          onColumnPinsChange={setColumnPins}
          onSelectionChange={(_ids, selectedRows) => setSelectedRows(selectedRows)}
        />
      </div>

      <p className="demo__selection">
        {selectedRows.length === 0
          ? 'Select one or more rows.'
          : `Selected (${selectedRows.length}): ${selectedRows
              .slice(0, 5)
              .map((row) => row.name)
              .join(', ')}${selectedRows.length > 5 ? '…' : ''}`}
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
