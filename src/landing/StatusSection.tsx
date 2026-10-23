import { useEffect, useState } from 'react';
import { SectionHeader } from './ui';

type Health = {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
};

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: Health }
  | { kind: 'error'; message: string };

const SLOW_AFTER_MS = 4000;
const TIMEOUT_MS = 60000;
const TIMEOUT_REASON = 'timeout';

function isHealth(value: unknown): value is Health {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.status === 'string' &&
    typeof v.service === 'string' &&
    typeof v.environment === 'string' &&
    typeof v.timestamp === 'string'
  );
}

function healthUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return `${(base ?? '').replace(/\/+$/, '')}/api/health`;
}

export function StatusSection() {
  const [state, setState] = useState<HealthState>({ kind: 'loading' });
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    const abortTimer = window.setTimeout(() => controller.abort(TIMEOUT_REASON), TIMEOUT_MS);

    fetch(healthUrl(), { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`The API answered with HTTP ${response.status}`);
        const body: unknown = await response.json();
        if (!isHealth(body)) throw new Error('The API response was not in the expected format');
        setState({ kind: 'ok', data: body });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted && controller.signal.reason !== TIMEOUT_REASON) return;
        const message =
          error === TIMEOUT_REASON
            ? 'The request timed out after 60 seconds'
            : error instanceof Error
              ? error.message
              : 'Unknown error';
        setState({ kind: 'error', message });
      })
      .finally(() => {
        window.clearTimeout(slowTimer);
        window.clearTimeout(abortTimer);
        if (!controller.signal.aborted || controller.signal.reason === TIMEOUT_REASON) setSlow(false);
      });

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(abortTimer);
      controller.abort();
    };
  }, [attempt]);

  const recheck = () => {
    setState({ kind: 'loading' });
    setSlow(false);
    setAttempt((value) => value + 1);
  };

  const loading = state.kind === 'loading';

  return (
    <section id="status" className="bs-section" aria-labelledby="status-title">
      <div className="bs-container">
        <SectionHeader
          index="04"
          label="STATUS"
          titleId="status-title"
          title="What is working today."
          intro="This page checks the API server live. A reachable server does not mean the database or sign-in has been verified."
        />

        <div className="bs-card bs-statuscard">
          <div className="bs-statuscard__head">
            <p className="bs-label">API HEALTH CHECK</p>
            <button type="button" className="bs-btn bs-btn--secondary bs-btn--compact" onClick={recheck} disabled={loading}>
              {loading ? 'Checking' : 'Check again'}
            </button>
          </div>

          <div aria-live="polite" className="bs-statuscard__body">
            {state.kind === 'loading' ? (
              <p className="bs-body-md bs-muted">
                {slow
                  ? 'Still waiting. The server may be waking up after a period of inactivity, which can take up to a minute.'
                  : 'Contacting the API server…'}
              </p>
            ) : null}

            {state.kind === 'error' ? (
              <>
                <p className="bs-status-line">
                  <span className="bs-dot bs-dot--error" aria-hidden="true" />
                  <span className="bs-body-md">API unreachable</span>
                </p>
                <p className="bs-body-md bs-muted">{state.message}</p>
              </>
            ) : null}

            {state.kind === 'ok' ? (
              <>
                <p className="bs-status-line">
                  <span className="bs-dot bs-dot--ok" aria-hidden="true" />
                  <span className="bs-body-md">API reachable</span>
                </p>
                <dl className="bs-dl">
                  <div>
                    <dt>STATUS</dt>
                    <dd>{state.data.status}</dd>
                  </div>
                  <div>
                    <dt>SERVICE</dt>
                    <dd>{state.data.service}</dd>
                  </div>
                  <div>
                    <dt>ENVIRONMENT</dt>
                    <dd>{state.data.environment}</dd>
                  </div>
                  <div>
                    <dt>SERVER TIME</dt>
                    <dd>{state.data.timestamp}</dd>
                  </div>
                </dl>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
