import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import type { HealthState } from '../../hooks/useApiHealth';

function ApiStatusChip({ health }: { health: HealthState }) {
  if (health.kind === 'loading') {
    return (
      <div className="chip chip-loading" role="status">
        <span className="chip-dot" aria-hidden="true" />
        <span>Checking API…</span>
      </div>
    );
  }

  if (health.kind === 'error') {
    return (
      <div className="chip chip-error" role="status" title={health.message}>
        <span className="chip-dot" aria-hidden="true" />
        <span>API unreachable</span>
      </div>
    );
  }

  return (
    <div
      className="chip chip-ok"
      role="status"
      title="Only the health endpoint responded. The database connection and sign-in-protected endpoints have not been checked."
    >
      <span className="chip-dot" aria-hidden="true" />
      <span>API reachable</span>
      <span className="chip-note">health check only</span>
    </div>
  );
}

export function TopBar({ health }: { health: HealthState }) {
  return (
    <header className="topbar">
      <div className="topbar-id">
        <span className="topbar-title">Coastal Command</span>
        <span className="topbar-sub">
          Beach Safety Intelligence Platform · Andhra Pradesh
        </span>
        <span className="tag-proto">PROTOTYPE</span>
      </div>

      <div className="topbar-right">
        <ApiStatusChip health={health} />

        <div className="auth" aria-label="Account">
          <Show when="signed-out">
            <SignInButton>
              <button type="button" className="btn btn-primary">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button type="button" className="btn">
                Sign up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <span className="auth-note">Signed in · role not verified</span>
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
