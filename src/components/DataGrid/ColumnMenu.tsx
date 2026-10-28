import { useCallback, useEffect, useRef, useState } from 'react';

const MENU_WIDTH = 180;
const MENU_GAP = 4;
const VIEWPORT_PADDING = 8;

interface ColumnMenuProps {
  columnId: string;
  pinned: boolean;
  onTogglePin: (columnId: string) => void;
}

export function ColumnMenu({ columnId, pinned, onTogglePin }: ColumnMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    itemRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      buttonRef.current?.focus();
    };
    const handleViewportChange = () => close();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [close, open]);

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING);

    setPosition({
      top: rect.bottom + MENU_GAP,
      left: Math.min(Math.max(VIEWPORT_PADDING, rect.right - MENU_WIDTH), maxLeft),
    });
    setOpen(true);
  };

  const menu =
    open && position ? (
      <div
        ref={menuRef}
        className="pdg__menu-dropdown"
        role="menu"
        style={{ top: position.top, left: position.left }}
      >
        <button
          ref={itemRef}
          type="button"
          role="menuitem"
          className="pdg__menu-item"
          onClick={() => {
            onTogglePin(columnId);
            setOpen(false);
          }}
        >
          {pinned ? 'Unpin column' : 'Pin column'}
        </button>
      </div>
    ) : null;

  return (
    <div className="pdg__menu">
      <button
        ref={buttonRef}
        type="button"
        className="pdg__menu-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Column menu for ${columnId}`}
        onClick={toggleOpen}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {menu}
    </div>
  );
}
