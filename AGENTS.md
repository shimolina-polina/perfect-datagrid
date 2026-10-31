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

## Git Workflow

- Основная ветка — `main`. Прямые коммиты и пуш в `main` не делать: каждая задача — отдельная ветка.
- Перед началом: `git status`, `git switch main`, `git pull --ff-only`, затем `git switch -c <type>/<short-name>`.
- Префиксы веток: `feat/`, `fix/`, `refactor/`, `docs/`, `test/`, `chore/`. Пример: `feat/column-pinning`.
- Коммиты атомарные, в формате Conventional Commits: `type(scope): summary` (например, `feat(datagrid): add column pinning`). Заголовок на английском, повелительное наклонение, до 72 символов.
- Перед коммитом выполнять `npm run typecheck && npm run lint && npm test && npm run build`.
- В коммит не должны попадать `node_modules/`, `dist/`, `.idea/`, секреты и локальные `.env`.
- Не амендить опубликованные коммиты и не делать force-push в общие ветки. В своей ветке при необходимости — только `--force-with-lease`.
- Перед PR синхронизировать ветку с `main`: `git fetch origin && git rebase origin/main`.
- После пуша ветки открыть PR в `main` (GitHub UI или `gh pr create --base main --fill`, если `gh` установлен). В описании PR: что изменено, зачем и как проверено.
- Мержить PR только после зелёных проверок и ревью, после мержа удалять ветку.
- Коммит, пуш, PR и мерж выполнять только по явной просьбе пользователя.

## Structure

Файлы группируются по ответственности, а не по типу. Корень компонента содержит только точку входа, композицию, публичные типы и стили; всё остальное разложено по подпапкам.

```text
src/
  index.ts                            публичный API пакета
  components/
    DataGrid/
      index.ts                        экспорт компонента и типов
      DataGrid.tsx                    состояние и композиция
      types.ts                        публичные типы
      DataGrid.css                    все стили компонента
      header/                         всё, что рендерится в thead
        DataGridHeader.tsx
        ColumnDragHandle.tsx
        ColumnFilterSelect.tsx
        ColumnMenu.tsx
        ColumnResizeHandle.tsx
      body/                           всё, что рендерится в tbody
        DataGridBody.tsx
        DataGridRow.tsx
      shared/                         переиспользуемые UI-примитивы
        SelectionCheckbox.tsx
      hooks/                          stateful React-логика без JSX
        useMeasuredColumnWidths.ts
        useStickyHeaderOffset.ts
      lib/                            чистые функции без React
        utils.ts
      __tests__/
        DataGrid.test.tsx
  demo/
    main.tsx
    demo.css
```

### Placement Rules

- В корне `components/DataGrid/` живут только `index.ts`, `DataGrid.tsx`, `types.ts` и `DataGrid.css`. Новые компоненты, хуки и утилиты сюда не добавлять.
- `header/` — компоненты и обработчики, которые рендерятся только внутри `<thead>`.
- `body/` — компоненты строк, ячеек и empty state для `<tbody>`.
- `shared/` — самостоятельные UI-примитивы, используемые минимум в двух областях (`header` и `body`). Если компонент нужен только одному разделу, он остаётся в этом разделе.
- `hooks/` — хуки с состоянием или эффектами. Файлы называются `use*.ts` и не содержат JSX.
- `lib/` — чистые функции без React, DOM и побочных эффектов. Имена файлов в camelCase.
- `__tests__/` — тесты публичного поведения компонента. Внутренние файлы не тестируются напрямую, если это не чистая функция из `lib/`.
- Компоненты называются в PascalCase, папки — в нижнем регистре, кроме `__tests__`.
- Импорты идут только вниз по зависимостям: `DataGrid.tsx` → `header` / `body` / `hooks` / `lib`; `header` и `body` → `shared` / `lib` / `types`; `shared` и `lib` не импортируют `header` или `body`. Циклические импорты запрещены.
- Новый файл кладётся по ответственности. Если не подходит ни одна папка, сначала обсуждается новая категория, а не добавление файла в корень.

## Architecture Rules

- `DataGrid.tsx` — единственное место, где хранится состояние: сортировка, фильтры, выбор, ширины, порядок колонок и переопределения закрепления.
- Настройки сортировки, фильтрации, порядка и закрепления поддерживают controlled и uncontrolled режимы по одному шаблону: `value` / `defaultValue` / `onValueChange`. Если controlled-prop не передан, состояние хранится внутри `DataGrid`, а колбэк всё равно вызывается.
- `columnPins` — переопределения поверх `column.pin`: `'left'`/`'right'` закрепляют колонку, `null` открепляет, отсутствие ключа оставляет значение из конфигурации колонки.
- Дочерние компоненты должны оставаться презентационными: получать данные и коллбэки через props.
- Новые типы — в `types.ts`; чистые функции — в `lib/utils.ts`.
- `shared/` не знает о конкретных разделах `header` и `body`; зависимости направлены только от разделов к `shared`.
- Публичный API менять только через `src/index.ts` и `src/components/DataGrid/index.ts`.
- Стили держать в одном `DataGrid.css`, классы с префиксом `pdg`, цвета через CSS-переменные `--pdg-*`.
- `react`, `react-dom`, `react/jsx-runtime` должны оставаться external в `vite.config.ts`.
- `dist/` генерируется сборкой, вручную его не редактировать.

## Component Behavior

- Внешнее управление настройками: `sort` / `defaultSort` / `onSortChange`, `filters` / `defaultFilters` / `onFiltersChange`, `columnOrder` / `defaultColumnOrder` / `onColumnOrderChange`, `columnPins` / `defaultColumnPins` / `onColumnPinsChange`.
- Сортировка: `sortAccessor` опционален, состояния `asc -> desc -> none`.
- Выбор: `selectionMode: 'none' | 'single' | 'multiple'`.
  - Controlled: `selectedRowIds`; uncontrolled: `defaultSelectedRowIds`.
  - `onSelectionChange(ids, rows)` вызывается при изменении.
  - `isRowSelected` — внешняя подсветка поверх встроенного выбора.
  - Row id берётся из `getRowId(row, index)`, иначе это индекс. При сортировке индекс меняется, поэтому для стабильного выбора нужен `getRowId`.
- Ресайз: `resizableColumns`, `minColumnWidth`, `column.resizable: false` отключает колонку. Ширины хранятся по `column.id`, применяются через `<colgroup>`; при ресайзе таблица переходит на `table-layout: fixed`.
- Перестановка: `reorderableColumns`. Порядок хранится по id и объединяется с актуальным списком `columns` (новые колонки добавляются в конец). Работает drag-and-drop и стрелки на хвате. Перестановка разрешена только внутри группы с одинаковым `pin`.
- Закрепление: `column.pin: 'left' | 'right'`. Колонки группируются по краям (`left`, обычные, `right`), смещения считаются из фактических ширин через `ResizeObserver` с fallback на числовой `column.width`. При `selectionMode: 'multiple'` колонка выбора тоже закреплена слева. Меню колонки позволяет закрепить её слева или открепить; переопределения хранятся в `DataGrid`.
- Фильтрация: `filterableColumns` включает строку фильтров под заголовком. Значение колонки берётся из `column.filterAccessor`, затем из `sortAccessor`, затем из `accessor`, если он возвращает примитив; `column.filterable: false` отключает фильтр. `column.filterType: 'select'` рендерит мультивыбор со списком уникальных значений из данных, пустые строки показываются как `(empty)`; `'text'` — поиск по подстроке. Поиск регистронезависимый, значения внутри одной колонки объединяются через ИЛИ, фильтры разных колонок — через И, фильтрация применяется до сортировки.
- `ColumnFilters` хранит `string` для текстовых фильтров и `readonly string[]` для select-фильтров. Неконтролируемый режим работает без пропа `filters`: состояние хранится внутри, а `onFiltersChange` вызывается при изменении. `column.filterAccessor` для нестроковых данных приводится к строке, `Date` — к ISO.
- Раскладка: таблица не выходит за контейнер, скроллится внутри `.pdg__scroll`; если у родителя задана высота, грид ужимается до неё (`.pdg` — flex-колонка с `max-height: 100%`, `.pdg__frame` и `.pdg__scroll` растягиваются и имеют `min-height: 0`); при `maxHeight` заголовок и строка фильтров закреплены сверху (`position: sticky`), текст в ячейках переносится на несколько строк.

## Testing

- Тесты: `src/components/DataGrid/__tests__/DataGrid.test.tsx`.
- `vitest.setup.ts` подключает jest-dom и `cleanup` после каждого теста.
- Использовать role-based queries (`getByRole`, `getByLabelText`).
- Хелперы: `bodyValues(columnIndex)` — значения колонки по всем строкам; `rowCells(rowIndex)` — ячейки одной строки.
- При изменении поведения компонента добавлять или обновлять тесты.
- jsdom ограничен: `getBoundingClientRect` возвращает нули, pointer capture может отсутствовать — в коде использовать optional chaining для DOM API.

## Packaging

- npm публикует только `dist` (`files` в `package.json`).
- Точки входа: `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`.
- Сборка добавляет CSS в `dist/index.js` и `dist/index.cjs`: при импорте создаётся `<style id="perfect-datagrid-style">`, повторная инъекция и импорт без `document` пропускаются. Плагин — `injectStyles` в `vite.config.ts`, поэтому `./dist/index.js` и `./dist/index.cjs` перечислены в `sideEffects`.
- `perfect-datagrid/style.css` остаётся опубликованным для явного импорта (строгий CSP, собственный CSS-пайплайн).
- Перед публикацией: обновить версию и проверить `npm pack --dry-run`.

## Code Style

- TypeScript strict, type-only imports (`import type`).
- Функциональные компоненты, именованные экспорты, без `any`.
- Не добавлять комментарии без необходимости.
- Не добавлять новые зависимости без явной причины.
- Git-операции — по правилам раздела `Git Workflow`; без явной просьбы не коммитить, не пушить и не создавать PR.
