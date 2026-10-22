import type { ReactNode } from 'react';
import type { HealthState } from '../../hooks/useApiHealth';
import { LogoMark, NavIcon } from '../ui/icons';
import type { NavIconName } from '../ui/icons';
import { TopBar } from './TopBar';

type NavItem = {
  name: NavIconName;
  label: string;
  active: boolean;
};

// Only Monitoring exists. The other sections are shown disabled so that nothing
// looks functional when it is not.
const NAV_ITEMS: readonly NavItem[] = [
  { name: 'monitoring', label: 'Monitoring', active: true },
  { name: 'incidents', label: 'Incidents', active: false },
  { name: 'advisories', label: 'Advisories', active: false },
  { name: 'analytics', label: 'Analytics', active: false },
  { name: 'settings', label: 'Settings', active: false },
];

export function AppShell({
  health,
  children,
}: {
  health: HealthState;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <nav className="rail" aria-label="Primary">
        <div className="rail-brand" aria-hidden="true">
          <LogoMark />
        </div>
        <ul className="rail-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.name}>
              {item.active ? (
                <button
                  type="button"
                  className="rail-item is-active"
                  aria-current="page"
                >
                  <NavIcon name={item.name} />
                  <span className="rail-label">{item.label}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="rail-item"
                  disabled
                  aria-label={`${item.label} (planned, not available)`}
                  title={`${item.label}: planned, not available yet`}
                >
                  <NavIcon name={item.name} />
                  <span className="rail-label">{item.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="shell-main">
        <TopBar health={health} />
        <main id="main" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
