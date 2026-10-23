import type { ReactNode } from 'react';
import type { HealthState } from '../../hooks/useApiHealth';
import { NavIcon } from '../ui/icons';
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

export function AppShell({ health, children }: { health: HealthState; children: ReactNode }) {
  return (
    <div className="cc-shell">
      <a className="cc-skip" href="#main">
        Skip to main content
      </a>

      <TopBar health={health} />

      <div className="cc-body">
        <nav className="cc-rail" aria-label="Dashboard sections">
          <ul className="cc-rail__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.name}>
                {item.active ? (
                  <button type="button" className="cc-rail__item is-active" aria-current="page">
                    <NavIcon name={item.name} />
                    <span className="cc-rail__label">{item.label}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cc-rail__item"
                    disabled
                    aria-label={`${item.label} (planned, not available)`}
                    title={`${item.label}: planned, not available yet`}
                  >
                    <NavIcon name={item.name} />
                    <span className="cc-rail__label">{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="cc-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
