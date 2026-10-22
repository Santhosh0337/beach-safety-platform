import { useEffect, useState } from 'react';

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
};

export type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

/**
 * Calls GET {VITE_API_BASE_URL}/api/health once on mount.
 *
 * A successful result only proves that the health endpoint answered. It does
 * not verify the database connection or any authenticated endpoint.
 */
export function useApiHealth(): HealthState {
  const [health, setHealth] = useState<HealthState>(() =>
    API_BASE_URL
      ? { kind: 'loading' }
      : { kind: 'error', message: 'VITE_API_BASE_URL is not set' },
  );

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();

    fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal })
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

  return health;
}
