import { type KeyboardEvent, useRef } from 'react';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

const units: { value: Unit; label: string; accessibleName: string }[] = [
  { value: 'celsius', label: '°C', accessibleName: 'Graus Celsius' },
  { value: 'fahrenheit', label: '°F', accessibleName: 'Graus Fahrenheit' },
];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const buttonRefs = useRef<HTMLButtonElement[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % units.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + units.length) % units.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = units.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    buttonRefs.current[nextIndex]?.focus();
    onChange(units[nextIndex].value);
  }

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      {units.map((option, index) => {
        const isSelected = unit === option.value;

        return (
          <button
            key={option.value}
            ref={(element) => {
              if (element) buttonRefs.current[index] = element;
            }}
            type="button"
            aria-label={option.accessibleName}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-w-12 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 ${
              isSelected
                ? 'bg-accent-500 text-night-900 hover:bg-accent-400'
                : 'text-white hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
