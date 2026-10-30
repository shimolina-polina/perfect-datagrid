import type { ColumnFilterValue } from '../types';

export const SELECTION_COLUMN_ID = '__selection__';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function toFilterText(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

export function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  const a = left instanceof Date ? left.getTime() : left;
  const b = right instanceof Date ? right.getTime() : right;

  if (typeof a === 'number' && typeof b === 'number') return a - b;

  return collator.compare(String(a), String(b));
}

export function matchesFilter(value: unknown, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const text = toFilterText(value);
  return text !== null && text.toLowerCase().includes(normalizedQuery);
}

export function matchesFilterValues(value: unknown, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;

  const text = toFilterText(value);
  if (text === null) return false;

  const normalized = text.toLowerCase();
  return selected.some((option) => option.toLowerCase() === normalized);
}

export function collectFilterOptions<T>(
  rows: readonly T[],
  accessor: (row: T) => unknown,
): string[] {
  const options = new Set<string>();

  rows.forEach((row) => {
    const text = toFilterText(accessor(row));
    if (text !== null) {
      options.add(text);
    }
  });

  return [...options].sort(collator.compare);
}

export function normalizeFilterValues(value: ColumnFilterValue | undefined): string[] {
  if (value === undefined) return [];
  if (typeof value === 'string') return value === '' ? [] : [value];
  return [...value];
}

export function isEmptyFilterValue(value: ColumnFilterValue | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  return value.length === 0;
}

export function isSameFilterValue(
  left: ColumnFilterValue | undefined,
  right: ColumnFilterValue | undefined,
): boolean {
  const a = normalizeFilterValues(left);
  const b = normalizeFilterValues(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items];
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);

  return next;
}
