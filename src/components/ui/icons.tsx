import type { ReactNode } from 'react';
import type { RiskLevel } from '../../types/monitoring';

export type NavIconName =
  | 'monitoring'
  | 'incidents'
  | 'advisories'
  | 'analytics'
  | 'settings';

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function LogoMark() {
  return (
    <Svg size={24}>
      <path d="M3 7q2.25-2.5 4.5 0t4.5 0 4.5 0 4.5 0" />
      <path d="M3 12q2.25-2.5 4.5 0t4.5 0 4.5 0 4.5 0" />
      <path d="M3 17q2.25-2.5 4.5 0t4.5 0 4.5 0 4.5 0" />
    </Svg>
  );
}

export function NavIcon({ name }: { name: NavIconName }) {
  switch (name) {
    case 'monitoring':
      return (
        <Svg>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </Svg>
      );
    case 'incidents':
      return (
        <Svg>
          <path d="M12 4 3 20h18L12 4z" />
          <path d="M12 10v4M12 17h.01" />
        </Svg>
      );
    case 'advisories':
      return (
        <Svg>
          <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z" />
          <path d="M10 21h4" />
        </Svg>
      );
    case 'analytics':
      return (
        <Svg>
          <path d="M5 20V10M12 20V4M19 20v-7" />
        </Svg>
      );
    case 'settings':
      return (
        <Svg>
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </Svg>
      );
  }
}

/** Each risk level has its own shape so that color is never the only signal. */
export function RiskIcon({ level }: { level: RiskLevel }) {
  switch (level) {
    case 'red':
      return (
        <Svg size={18}>
          <path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5z" />
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
        </Svg>
      );
    case 'orange':
      return (
        <Svg size={18}>
          <path d="M12 4 3 20h18L12 4z" />
          <path d="M12 10v4M12 17h.01" />
        </Svg>
      );
    case 'yellow':
      return (
        <Svg size={18}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </Svg>
      );
    case 'green':
      return (
        <Svg size={18}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.7 2.7L16 9.5" />
        </Svg>
      );
    case 'gray':
      return (
        <Svg size={18}>
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .8-1 1.7M12 17h.01" />
        </Svg>
      );
  }
}
