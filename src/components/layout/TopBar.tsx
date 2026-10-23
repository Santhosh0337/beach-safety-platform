import { useEffect, useState } from 'react';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import type { HealthState } from '../../hooks/useApiHealth';
import { ThemeSelector } from '../ui/ThemeSelector';
import { LogoMark } from '../ui/icons';

function ApiStatusChip({ health }: { health: HealthState }) {
  if (health.kind === 'loading') {
    return (
      <div className="cc-api cc-api--loading" role="status">
        <span className="cc-api__dot" aria-hidden="true" />
        <span className="cc-api__label">Checking API…</span>
      </div>
    );
  }

  if (health.kind === 'error') {
    return (
      <div className="cc-api cc-api--error" role="status" title={health.message}>
        <span className="cc-api__dot" aria-hidden="true" />
        <span className="cc-api__label">API unreachable</span>
      </div>
    );
  }

  return (
    <div
      className="cc-api cc-api--ok"
      role="status"
      title="Only the health endpoint responded. The database connection and sign-in-protected endpoints have not been checked."
    >
      <span className="cc-api__dot" aria-hidden="true" />
      <span className="cc-api__label">API reachable</span>
      <span className="cc-api__note">health check only</span>
    </div>
  );
}

function OperationalClock() {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const utc = now.toISOString().substring(11, 19);
  const ist = now.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="cc-clock" role="group" aria-label="Current time in UTC and Indian Standard Time">
      <span className="cc-clock__item">
        <span className="cc-clock__zone">UTC</span>
        <span className="cc-clock__time">{utc}</span>
      </span>
      <span className="cc-clock__item">
        <span className="cc-clock__zone">IST</span>
        <span className="cc-clock__time">{ist}</span>
      </span>
    </div>
  );
}

export function TopBar({ health }: { health: HealthState }) {
  return (
    <header className="cc-topbar">
      <div className="cc-topbar__left">
        <a className="cc-brand" href="/" aria-label="Beach Safety Intelligence Platform, public landing page">
          <LogoMark />
          <span className="cc-brand__text">
            <span className="cc-brand__name">Coastal Command</span>
            <span className="cc-brand__sub">Beach Safety Intelligence · Andhra Pradesh</span>
          </span>
        </a>
        <span className="cc-tag cc-tag--warn">Prototype</span>
        <a className="cc-toplink" href="/">
          <span aria-hidden="true">←</span> Landing page
        </a>
      </div>

      <div className="cc-topbar__right">
        <OperationalClock />
        <ApiStatusChip health={health} />
        <ThemeSelector />

        <div className="cc-auth" role="group" aria-label="Account">
          <Show when="signed-out">
            <SignInButton>
              <button type="button" className="cc-btn cc-btn--primary">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button type="button" className="cc-btn">
                Sign up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <span className="cc-auth__note">Signed in · role not verified</span>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
