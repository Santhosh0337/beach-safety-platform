

import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import {
  THEME_OPTIONS,
  setThemePreference,
  useThemePreference,
} from '../../theme/theme';
import type { ThemePreference } from '../../theme/theme';
import './theme-selector.css';

const LABELS: Record<ThemePreference, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
};

const TITLES: Record<ThemePreference, string> = {
  dark: 'Dark theme',
  light: 'Light theme',
  system: 'Follow the device setting',
};

function ThemeIcon({ option }: { option: ThemePreference }) {
  const common = {
    className: 'ts__icon',
    viewBox: '0 0 24 24',
    width: 15,
    height: 15,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  if (option === 'dark') {
    return (
      <svg {...common}>
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
    );
  }

  if (option === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="1" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

/**
 * Three-way theme switch. Implemented as a radio group: one tab stop, arrow keys
 * move and select, and the current choice is exposed through aria-checked.
 */
export function ThemeSelector({ className }: { className?: string }) {
  const preference = useThemePreference();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = THEME_OPTIONS.indexOf(preference);
    let next: number;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % THEME_OPTIONS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = THEME_OPTIONS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setThemePreference(THEME_OPTIONS[next]);
    buttons.current[next]?.focus();
  };

  return (
    <div
      className={className ? `ts ${className}` : 'ts'}
      role="radiogroup"
      aria-label="Colour theme"
      onKeyDown={onKeyDown}
    >
      {THEME_OPTIONS.map((option, index) => {
        const checked = option === preference;

        return (
          <button
            key={option}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={LABELS[option]}
            title={TITLES[option]}
            tabIndex={checked ? 0 : -1}
            className="ts__opt"
            onClick={() => setThemePreference(option)}
          >
            <ThemeIcon option={option} />
            <span className="ts__text">{LABELS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
