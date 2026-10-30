import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

export function useStickyHeaderOffset(tableRef: RefObject<HTMLTableElement | null>) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const row = tableRef.current?.tHead?.rows[0];
    if (!row) return;

    const update = () => setOffset(row.offsetHeight);
    update();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(update);
    observer.observe(row);

    return () => observer.disconnect();
  }, [tableRef]);

  return offset;
}
