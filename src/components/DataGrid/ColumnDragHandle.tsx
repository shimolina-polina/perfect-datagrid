import type { DragEvent, KeyboardEvent } from 'react';

interface ColumnDragHandleProps {
  columnId: string;
  label: string;
  onDragStart: (columnId: string) => void;
  onDragEnd: () => void;
  onMove: (columnId: string, offset: number) => void;
}

export function ColumnDragHandle({
  columnId,
  label,
  onDragStart,
  onDragEnd,
  onMove,
}: ColumnDragHandleProps) {
  const handleDragStart = (event: DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', columnId);
    onDragStart(columnId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    onMove(columnId, event.key === 'ArrowLeft' ? -1 : 1);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      draggable
      className="pdg__drag-handle"
      aria-label={label}
      title="Drag to reorder, or use the arrow keys"
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={handleKeyDown}
    >
      ⠿
    </span>
  );
}
