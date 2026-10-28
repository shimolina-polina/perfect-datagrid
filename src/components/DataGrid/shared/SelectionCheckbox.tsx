import { useEffect, useRef } from 'react';

interface SelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
}

export function SelectionCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: SelectionCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      className="pdg__checkbox"
      checked={checked}
      aria-label={label}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
    />
  );
}
