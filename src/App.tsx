
import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
};

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

export default function App() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/health', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<HealthResponse>;
      })
      .then((data) => setHealth({ kind: 'ok', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;

        setHealth({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="page">
      <h1>Beach Safety Intelligence Platform</h1>
      <p>
        Temporary Phase 1 setup page. The real interface will be designed in Phase 4, after you
        approve a design direction.
      </p>

      <h2>API health</h2>

      {health.kind === 'loading' && (
        <span className="badge badge-loading">Checking…</span>
      )}

      {health.kind === 'error' && (
        <>
          <span className="badge badge-error">API unreachable</span>
          <p>{health.message}</p>
        </>
      )}

      {health.kind === 'ok' && (
        <>
          <span className="badge badge-ok">API reachable</span>
          <pre>{JSON.stringify(health.data, null, 2)}</pre>
        </>
      )}
    </main>
  );
}
