import React, {ReactNode} from "react";

type DropdownOption = {
  value: string;
  label: ReactNode;
  selected: boolean;
};

type MultiSelectDropdownButtonProps = {
  label: ReactNode;
  options: DropdownOption[];
  onToggle: (value: string) => void;
  className?: string;
  align?: 'left' | 'right';
};

/**
 * A button component that ungolds a dropdown with a list of checkbox options,
 * allowing users to select multiple items from these options.
 */
function MultiSelectDropdownButton({
  label,
  options,
  onToggle,
  className = 'btn btn-primary dropdown',
  align = 'left',
}: MultiSelectDropdownButtonProps) {
  return (
    <div style={{position: 'relative'}}>
      <button className={className} data-toggle="dropdown">
        {label}
      </button>
      <ul className={`dropdown-menu ${align == 'right' && 'dropdown-menu-right'}`}>
        {options.map(({value, label, selected}) => (
          <li
            key={value}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
            }}
            onClick={(e) => {
              onToggle(value);
              e.stopPropagation();
            }}
          >
            <span>{label}</span>
            <input
              type="checkbox"
              checked={selected}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onToggle(value)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MultiSelectDropdownButton;
