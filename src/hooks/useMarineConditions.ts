import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/apiBase';
import type { BeachId } from '../types/monitoring';
import type { MarineApiResponse, MarineState } from '../types/marine';

// The API may be starting up, so the first request is allowed to take a while.
const REQUEST_TIMEOUT_MS = 45_000;
const SLOW_AFTER_MS = 6_000;
// Matches the server cache window: refreshing sooner would just return the stored record.
const AUTO_REFRESH_MS = 10 * 60 * 1000;

type Settled = Extract<MarineState, { kind: 'ready' | 'error' }>;

class ApiProblem extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

function isMarineResponse(value: unknown): value is MarineApiResponse {
  if (typeof value !== 'object' || value === null) return false;
  const body = value as Partial<MarineApiResponse>;
  return (
    typeof body.beachId === 'string' &&
    typeof body.data === 'object' &&
    body.data !== null &&
    typeof body.data.fetchedAt === 'string'
  );
}

async function requestMarine(
  beachId: BeachId,
  signal: AbortSignal,
): Promise<MarineApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/marine?beachId=${encodeURIComponent(beachId)}`,
    { signal, headers: { Accept: 'application/json' } },
  );

    let body: unknown;
  try {
    body = await response.json();
  } catch {
    if (response.ok) {
      throw new ApiProblem(
        'The API returned invalid JSON.',
        true,
      );
    }
    body = undefined;
  }

  if (!response.ok) {
    const apiError = body as { message?: string; retryable?: boolean } | null;
    throw new ApiProblem(
      apiError?.message ?? `The API answered with HTTP ${response.status}.`,
      apiError?.retryable ?? response.status >= 500,
    );
  }
  if (!isMarineResponse(body) || body.beachId !== beachId) {
    throw new ApiProblem('The API returned an unexpected response.', true);
  }
  return body;
}

function describeError(error: unknown, timedOut: boolean): Settled {
  if (timedOut) {
    return { kind: 'error', message: 'The API did not respond in time.', retryable: true };
  }
  if (error instanceof ApiProblem) {
    return { kind: 'error', message: error.message, retryable: error.retryable };
  }
  return { kind: 'error', message: 'Could not reach the API.', retryable: true };
}

/**
 * Loads modelled marine conditions for one beach from the API.
 * Never substitutes demo or browser-cached values: a failed load becomes an error state.
 * A failed background refresh keeps the last real response on screen, so its age keeps showing.
 */
export function useMarineConditions(beachId: BeachId): {
  state: MarineState;
  retry: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  const runKey = `${beachId}:${attempt}`;
  const [settled, setSettled] = useState<{ beachId: BeachId; value: Settled } | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);

  const retry = useCallback(() => {
    setSettled(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();
    let timedOut = false;

    const slowTimer = setTimeout(() => setSlowKey(runKey), SLOW_AFTER_MS);
    const abortTimer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    requestMarine(beachId, controller.signal)
      .then((response) =>
        setSettled({
          beachId,
          value: { kind: 'ready', response, receivedAt: Date.now() },
        }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted && !timedOut) return; // unmounted or beach changed
        setSettled({ beachId, value: describeError(error, timedOut) });
      })
      .finally(() => {
        clearTimeout(slowTimer);
        clearTimeout(abortTimer);
      });

    return () => {
      controller.abort();
      clearTimeout(slowTimer);
      clearTimeout(abortTimer);
    };
  }, [beachId, runKey]);

  // Background refresh while the tab is visible. Failures here keep the previous data.
  useEffect(() => {
    if (!API_BASE_URL) return;

    let controller: AbortController | null = null;

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      controller?.abort();
      const current = new AbortController();
      controller = current;
      const abortTimer = setTimeout(() => current.abort(), REQUEST_TIMEOUT_MS);

      requestMarine(beachId, current.signal)
        .then((response) =>
          setSettled({
            beachId,
            value: { kind: 'ready', response, receivedAt: Date.now() },
          }),
        )
        .catch(() => {
          /* keep showing the last real data; its age is displayed */
        })
        .finally(() => clearTimeout(abortTimer));
    }, AUTO_REFRESH_MS);

    return () => {
      clearInterval(timer);
      controller?.abort();
    };
  }, [beachId]);

  let state: MarineState;
  if (!API_BASE_URL) {
    state = { kind: 'not-configured' };
  } else if (settled && settled.beachId === beachId) {
    state = settled.value;
  } else {
    // Values for a different beach are never shown while this one loads.
    state = { kind: 'loading', slow: slowKey === runKey };
  }

  return { state, retry };
}
