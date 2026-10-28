export const SELECTION_COLUMN_ID = '__selection__';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

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
  if (value == null) return false;

  const normalizedValue = value instanceof Date ? value.toISOString() : String(value);
  return normalizedValue.toLowerCase().includes(normalizedQuery);
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
