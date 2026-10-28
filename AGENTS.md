# AGENTS.md

## Project

`perfect-datagrid` — npm-пакет с React UI-компонентом таблицы. Библиотека собирается в ESM/CJS, типы генерируются автоматически. В репозитории также есть demo-playground.

## Stack

- React 19 в devDependencies, peerDependencies: `react`/`react-dom` >= 18
- TypeScript (strict), Vite в library mode, `vite-plugin-dts`
- Vitest + jsdom + Testing Library
- ESLint (flat config)

## Commands

```bash
npm install
npm run dev          # demo playground
npm run typecheck    # tsc --noEmit
npm run lint
npm test             # vitest run
npm run test:watch
npm run build        # dist (ESM/CJS + d.ts + style.css)
npm run preview
```

Перед завершением задачи обязательно выполнить:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Structure

```text
src/index.ts                         публичный API пакета
src/components/DataGrid/
  DataGrid.tsx                       состояние и композиция
  DataGridHeader.tsx                 thead, сортировка, чекбокс "выбрать все"
  DataGridBody.tsx                   tbody и empty state
  DataGridRow.tsx                    строка, ячейки, выбор
  SelectionCheckbox.tsx              чекбокс с indeterminate
  ColumnResizeHandle.tsx             ресайз колонки (pointer + клавиатура)
  ColumnDragHandle.tsx               drag-and-drop колонки + клавиатура
  types.ts                           публичные типы
  utils.ts                           чистые функции (сортировка, moveItem)
  DataGrid.css                       все стили компонента
  index.ts                           экспорт компонента и типов
src/demo/                            playground
```

## Architecture Rules

- `DataGrid.tsx` — единственное место, где хранится состояние: сортировка, выбор, ширины и порядок колонок.
- Дочерние компоненты должны оставаться презентационными: получать данные и коллбэки через props.
- Новые типы — в `types.ts`; чистые функции — в `utils.ts`.
- Публичный API менять только через `src/index.ts` и `src/components/DataGrid/index.ts`.
- Стили держать в одном `DataGrid.css`, классы с префиксом `pdg`, цвета через CSS-переменные `--pdg-*`.
- `react`, `react-dom`, `react/jsx-runtime` должны оставаться external в `vite.config.ts`.
- `dist/` генерируется сборкой, вручную его не редактировать.

## Component Behavior

- Сортировка: `sortAccessor` опционален, состояния `asc -> desc -> none`.
- Выбор: `selectionMode: 'none' | 'single' | 'multiple'`.
  - Controlled: `selectedRowIds`; uncontrolled: `defaultSelectedRowIds`.
  - `onSelectionChange(ids, rows)` вызывается при изменении.
  - `isRowSelected` — внешняя подсветка поверх встроенного выбора.
  - Row id берётся из `getRowId(row, index)`, иначе это индекс. При сортировке индекс меняется, поэтому для стабильного выбора нужен `getRowId`.
- Ресайз: `resizableColumns`, `minColumnWidth`, `column.resizable: false` отключает колонку. Ширины хранятся по `column.id`, применяются через `<colgroup>`; при ресайзе таблица переходит на `table-layout: fixed`.
- Перестановка: `reorderableColumns`. Порядок хранится по id и объединяется с актуальным списком `columns` (новые колонки добавляются в конец). Работает drag-and-drop и стрелки на хвате.

## Testing

- Тесты: `src/components/DataGrid/DataGrid.test.tsx`.
- `vitest.setup.ts` подключает jest-dom и `cleanup` после каждого теста.
- Использовать role-based queries (`getByRole`, `getByLabelText`).
- Хелперы: `bodyValues(columnIndex)` — значения колонки по всем строкам; `rowCells(rowIndex)` — ячейки одной строки.
- При изменении поведения компонента добавлять или обновлять тесты.
- jsdom ограничен: `getBoundingClientRect` возвращает нули, pointer capture может отсутствовать — в коде использовать optional chaining для DOM API.

## Packaging

- npm публикует только `dist` (`files` в `package.json`).
- Точки входа: `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`.
- CSS не инжектится автоматически: потребитель импортирует `perfect-datagrid/style.css`.
- Перед публикацией: обновить версию и проверить `npm pack --dry-run`.

## Code Style

- TypeScript strict, type-only imports (`import type`).
- Функциональные компоненты, именованные экспорты, без `any`.
- Не добавлять комментарии без необходимости.
- Не добавлять новые зависимости без явной причины.
- Не коммитить изменения, если об этом не попросили.
