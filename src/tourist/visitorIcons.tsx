/** Small inline icon set for the visitor pages. All icons are decorative (aria-hidden); labels come from the surrounding text. */

export type VisitorIconName =
  | 'flag'
  | 'lifebuoy'
  | 'person'
  | 'bell'
  | 'warning'
  | 'facility'
  | 'wave'
  | 'clock'
  | 'thermometer'
  | 'timer'
  | 'info'
  | 'phone'
  | 'arrow';

export function VisitorIcon({ name, size = 22 }: { name: VisitorIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  switch (name) {
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 4 2 4H5" />
        </svg>
      );
    case 'lifebuoy':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M5.6 5.6l3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" />
        </svg>
      );
    case 'person':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c.4-3.4 2.8-5.5 6-5.5s5.6 2.1 6 5.5" />
          <circle cx="17.5" cy="16.5" r="3" />
          <path d="M19.8 18.8L22 21" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16z" />
          <path d="M10 21h4" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 4 3 20h18L12 4z" />
          <path d="M12 10v4M12 17h.01" />
        </svg>
      );
    case 'facility':
      return (
        <svg {...common}>
          <path d="M4 21V9l8-5 8 5v12" />
          <path d="M3 21h18" />
          <path d="M12 11v6M9 14h6" />
        </svg>
      );
    case 'wave':
      return (
        <svg {...common}>
          <path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
          <path d="M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
          <path d="M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'thermometer':
      return (
        <svg {...common}>
          <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" />
        </svg>
      );
    case 'timer':
      return (
        <svg {...common}>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 1.5M9 3h6" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
  }
}
