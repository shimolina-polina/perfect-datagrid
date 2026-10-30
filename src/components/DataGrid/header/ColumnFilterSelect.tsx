import { useCallback, useEffect, useRef, useState } from 'react';

const DROPDOWN_WIDTH = 220;
const DROPDOWN_GAP = 4;
const DROPDOWN_MAX_HEIGHT = 260;
const DROPDOWN_MIN_HEIGHT = 120;
const VIEWPORT_PADDING = 8;

function formatOption(option: string) {
  return option === '' ? '(empty)' : option;
}

interface ColumnFilterSelectProps {
  columnId: string;
  options: readonly string[];
  value: readonly string[];
  onChange: (values: string[]) => void;
}

export function ColumnFilterSelect({
  columnId,
  options,
  value,
  onChange,
}: ColumnFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    firstOptionRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      buttonRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, open]);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => close();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [close, open]);

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportHeight = window.innerHeight || DROPDOWN_MAX_HEIGHT + DROPDOWN_GAP * 2;
    const viewportWidth = window.innerWidth || DROPDOWN_WIDTH + VIEWPORT_PADDING * 2;
    const spaceBelow = viewportHeight - rect.bottom - DROPDOWN_GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - DROPDOWN_GAP - VIEWPORT_PADDING;
    const openUp = spaceBelow < DROPDOWN_MIN_HEIGHT && spaceAbove > spaceBelow;
    const available = openUp ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(DROPDOWN_MIN_HEIGHT, Math.min(DROPDOWN_MAX_HEIGHT, available));
    const top = openUp
      ? Math.max(VIEWPORT_PADDING, rect.top - DROPDOWN_GAP - maxHeight)
      : rect.bottom + DROPDOWN_GAP;
    const maxLeft = Math.max(VIEWPORT_PADDING, viewportWidth - DROPDOWN_WIDTH - VIEWPORT_PADDING);

    setPosition({
      top,
      left: Math.min(Math.max(VIEWPORT_PADDING, rect.left), maxLeft),
      maxHeight,
    });
    setOpen(true);
  };

  const toggleOption = (option: string, checked: boolean) => {
    onChange(
      checked
        ? [...value.filter((item) => item !== option), option]
        : value.filter((item) => item !== option),
    );
  };

  const summary =
    value.length === 0
      ? 'All'
      : value.length === 1
        ? formatOption(value[0])
        : `${value.length} selected`;

  return (
    <div className="pdg__filter-select">
      <button
        ref={buttonRef}
        type="button"
        className="pdg__filter-select-button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Filter ${columnId} column`}
        onClick={toggleOpen}
      >
        <span className="pdg__filter-select-value">{summary}</span>
        <span className="pdg__filter-select-icon" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && position ? (
        <div
          ref={dropdownRef}
          className="pdg__filter-dropdown"
          role="group"
          aria-label={`Filter ${columnId} column options`}
          style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
        >
          <div className="pdg__filter-options">
            {options.length === 0 ? (
              <span className="pdg__filter-empty">No values</span>
            ) : (
              options.map((option, index) => (
                <label key={option} className="pdg__filter-option">
                  <input
                    ref={index === 0 ? firstOptionRef : undefined}
                    type="checkbox"
                    className="pdg__filter-checkbox"
                    checked={value.includes(option)}
                    onChange={(event) => toggleOption(option, event.target.checked)}
                  />
                  <span className="pdg__filter-option-label">{formatOption(option)}</span>
                </label>
              ))
            )}
          </div>
          <button
            type="button"
            className="pdg__filter-clear"
            onClick={() => onChange([])}
            disabled={value.length === 0}
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}
