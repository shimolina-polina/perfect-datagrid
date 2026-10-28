import { useEffect, useRef, useState } from 'react';

export function useMeasuredColumnWidths(enabled: boolean, columnIds: readonly string[]) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const columnKey = columnIds.join('|');

  useEffect(() => {
    const table = tableRef.current;
    if (!enabled || !table) return;

    const measure = () => {
      const next: Record<string, number> = {};

      table.querySelectorAll<HTMLTableCellElement>('thead th[data-column-id]').forEach((cell) => {
        const id = cell.dataset.columnId;
        const width = cell.getBoundingClientRect().width;
        if (id && width > 0) {
          next[id] = width;
        }
      });

      setWidths((current) => {
        const currentIds = Object.keys(current);
        const nextIds = Object.keys(next);
        const isSame =
          currentIds.length === nextIds.length &&
          nextIds.every((id) => Math.abs((current[id] ?? 0) - next[id]) < 0.5);

        return isSame ? current : next;
      });
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    table.querySelectorAll<HTMLTableCellElement>('thead th[data-column-id]').forEach((cell) => {
      observer.observe(cell);
    });

    return () => observer.disconnect();
  }, [enabled, columnKey]);

  return { tableRef, widths };
}
