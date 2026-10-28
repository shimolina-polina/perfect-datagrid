import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';

interface ColumnResizeHandleProps {
  columnId: string;
  label: string;
  minWidth: number;
  onResize: (columnId: string, width: number) => void;
  onReset: (columnId: string) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startWidth: number;
}

export function ColumnResizeHandle({
  columnId,
  label,
  minWidth,
  onResize,
  onReset,
}: ColumnResizeHandleProps) {
  const dragRef = useRef<DragState | null>(null);

  useEffect(
    () => () => {
      document.body.classList.remove('pdg--resizing');
    },
    [],
  );

  const handlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;

    const headerCell = event.currentTarget.parentElement;
    if (!headerCell) return;

    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: headerCell.getBoundingClientRect().width,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add('pdg--resizing');
  };

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const width = Math.max(minWidth, Math.round(drag.startWidth + event.clientX - drag.startX));
    onResize(columnId, width);
  };

  const finishResize = (event: PointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    document.body.classList.remove('pdg--resizing');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const headerCell = event.currentTarget.parentElement;
    if (!headerCell) return;

    event.preventDefault();
    const currentWidth = headerCell.getBoundingClientRect().width;
    const delta = event.key === 'ArrowLeft' ? -16 : 16;
    onResize(columnId, Math.max(minWidth, Math.round(currentWidth + delta)));
  };

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      className="pdg__resize-handle"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishResize}
      onPointerCancel={finishResize}
      onLostPointerCapture={() => {
        dragRef.current = null;
        document.body.classList.remove('pdg--resizing');
      }}
      onDoubleClick={() => onReset(columnId)}
      onKeyDown={handleKeyDown}
    />
  );
}
